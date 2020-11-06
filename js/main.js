var App = {
  URL: 'https://politics-elex-results.data.api.cnn.io/results/view/2020-national-races-PG.json'
};

App.query = function() {
  return fetch(App.URL)
    .then(response => response.json())
    .then(data => new Result(data))
}


App.ready = function() {
  App.fetchDiff();
}

App.fetchDiff = function() {
  App.query()
    .then(App.render)
    .catch(error => console.error(error))
    .then(result => {
      setTimeout(App.fetchDiff, 30*1000)
    })
}

App.render = function(result) {
  const diff = result.diff(App.lastResult || new Result());

  for (const [state, res] of Object.entries(diff)) {
    const li = document.createElement('li');
    const row = `<span class="time">${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: false}).format(diff.time)}</span> `;

    li.innerHTML = row + [
    App.formatLine("Biden", res.biden),
      App.formatLine("Trump", res.trump),
      App.formatLine("Diff", res.difference),
      App.formatLine("Total Votes", res.count),
      App.formatLine("Percent Reporting", res.reporting),
    ].filter(r => r).join(", ")

    document.getElementById(state).prepend(li);
  }

  App.lastResult = result;
}


App.formatLine = function(label, diff={}) {
  const f = Intl.NumberFormat('en-US');

  if (diff.new) {
    let val = `${label}: ${f.format(diff.new)}`;
    if (diff.old > 0) {
      const difference = diff.new - diff.old;
      val += ` <span class="diff">(${difference < 0 ? '' : '+'}${f.format(diff.new - diff.old)})`
    }
    return val;
  }
}

let Result = class {
  static STATES = new Set(['AZ', 'GA', 'NV', 'PA']);

  constructor(data=[]) {
    this.data = this.constructor.parse(data);
    this.time = new Date();
  }

  static parse(data) {
    return Object.fromEntries(
      data.filter(state => Result.STATES.has(state.stateAbbreviation))
        .map(state => {
            const biden = state.candidates.find(candidate => candidate.lastNameSlug === "biden").voteNum;
            const trump = state.candidates.find(candidate => candidate.lastNameSlug === "trump").voteNum;
            return [
              state.stateAbbreviation,
              {
                biden: biden,
                trump: trump,
                difference: biden - trump,
                count: state.totalVote,
                reporting: state.percentReporting
              }
            ]
          }
        )
    )
  }

  diff(other) {
    const diff = {}
    for (const [state, stateData] of Object.entries(this.data)) {
      for (const [key, newValue] of Object.entries(stateData)) {
        const oldValue = other.data[state] && other.data[state][key] || 0;
        if (newValue !== oldValue) {
          diff[state] ||= {}
          diff[state][key] = { new: newValue, old: oldValue }
        }
      }
    }
    return diff
  }
}


if (document.readyState != 'loading'){
  App.ready();
} else {
  document.addEventListener('DOMContentLoaded', App.ready);
}

