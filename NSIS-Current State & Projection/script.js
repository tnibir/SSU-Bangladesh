const numberFmt = new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 });
const decimalFmt = new Intl.NumberFormat('en-BD', { maximumFractionDigits: 2 });
const moneyFmt = new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 });

const money = (value) => {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}Tk ${moneyFmt.format(Math.abs(rounded))}`;
};

const count = (value) => numberFmt.format(Math.round(value));
const num = (value) => decimalFmt.format(value);
const pct = (value) => `${(value * 100).toFixed(2)}%`;
const percentInput = (id) => getNumber(id, 0) / 100;
const accumulatedAmountTone = (accumulatedAmount, finalCost) => {
  if (accumulatedAmount < 0) return 'negative';
  if (finalCost <= 0) return 'high';

  const ratio = accumulatedAmount / finalCost;

  if (ratio <= 0.02) return 'low';
  if (ratio <= 0.05) return 'mid';
  if (ratio <= 0.1) return 'high';
  return 'very-high';
};
const toneBackgrounds = {
  negative: '#991b1b',
  low: '#fee2e2',
  mid: '#fef3c7',
  high: '#dcfce7',
  'very-high': '#166534'
};
const premiumCoverageTextColors = {
  underfunded: '#b91c1c',
  covered: '#15803d'
};
const outputTitle = (label, definitionId, tip) =>
  `<a class="output-title" href="#${definitionId}" data-tip="${tip}">${label}</a>`;

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(button => {
      const selected = button === btn;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', String(selected));
    });

    document.querySelectorAll('.tab-panel').forEach(panel => {
      const selected = panel.id === btn.dataset.tab;
      panel.classList.toggle('active', selected);
      panel.hidden = !selected;
    });
  });
});

document.querySelectorAll('.input-title').forEach(link => {
  link.addEventListener('click', event => {
    event.stopPropagation();
  });
});


function getNumber(id, fallback) {
  const field = document.getElementById(id);
  const value = Number(field?.value);
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readInputs() {
  return {
    workers: Math.max(1, getNumber('workers', 1000000)),
    wage: Math.max(1, getNumber('wage', 15000)),
    startYear: Math.round(clamp(getNumber('startYear', 2026), 2020, 2100)),
    timelineYears: Math.round(clamp(getNumber('timelineYears', 5), 1, 40)),
    workerGrowth: percentInput('workerGrowth'),
    wageGrowth: percentInput('wageGrowth'),
    fundReturn: percentInput('fundReturn'),
    margin: Math.max(0, percentInput('margin')),
    femaleShare: clamp(percentInput('femaleShare'), 0, 1),
    eisRate: Math.max(0, percentInput('eisRate')),
    eisBenefitMonths: Math.max(0, getNumber('eisBenefitMonths', 48)),
    birthRate: Math.max(0, percentInput('birthRate')),
    maternityWeeks: Math.max(0, getNumber('maternityWeeks', 17.14)),
    maternityReplacement: clamp(percentInput('maternityReplacement'), 0, 1),
    unempRate: Math.max(0, percentInput('unempRate')),
    unempMonths: Math.max(0, getNumber('unempMonths', 4)),
    unempReplacement: clamp(percentInput('unempReplacement'), 0, 1),
    unempServiceCost: Math.max(0, getNumber('unempServiceCost', 8000)),
    retireeRatio: Math.max(0, percentInput('retireeRatio')),
    pensionReplacement: clamp(percentInput('pensionReplacement'), 0, 1),
    contributions: {
      eis: percentInput('eisContribution'),
      maternity: percentInput('matContribution'),
      unemployment: percentInput('unempContribution'),
      pension: percentInput('oldContribution')
    }
  };
}

const policies = [
  {
    id: 'eis',
    name: 'Employment Injury Insurance',
    shortName: 'EIS',
    claimLabel: 'Claims per worker',
    contributionLabel: 'EIS premium',
    contributionBaseLabel: 'payroll',
    setupLabel: inputs => `${num(inputs.eisBenefitMonths)} wage months`,
    getClaimRate: inputs => inputs.eisRate,
    calculate: (inputs, workers, wage) => {
      const claims = workers * inputs.eisRate;
      return {
        claims,
        baseCost: claims * wage * inputs.eisBenefitMonths
      };
    }
  },
  {
    id: 'maternity',
    name: 'Maternity Benefit Insurance',
    shortName: 'Maternity',
    claimLabel: 'Birth rate among female workers',
    contributionLabel: 'Maternity premium',
    contributionBaseLabel: 'female-worker payroll',
    setupLabel: inputs => `${num(inputs.maternityWeeks)} weeks at ${pct(inputs.maternityReplacement)} wage`,
    getClaimRate: inputs => inputs.birthRate,
    getContributionBase: (inputs, workers, wage) => workers * inputs.femaleShare * wage * 12,
    calculate: (inputs, workers, wage) => {
      const claims = workers * inputs.femaleShare * inputs.birthRate;
      return {
        claims,
        baseCost: claims * wage * (inputs.maternityWeeks / 4.345) * inputs.maternityReplacement
      };
    }
  },
  {
    id: 'unemployment',
    name: 'Unemployment Insurance',
    shortName: 'Unemployment',
    claimLabel: 'Claims per worker',
    contributionLabel: 'Unemployment premium',
    contributionBaseLabel: 'payroll',
    setupLabel: inputs => `${num(inputs.unempMonths)} months at ${pct(inputs.unempReplacement)} wage + ${money(inputs.unempServiceCost)}`,
    getClaimRate: inputs => inputs.unempRate,
    calculate: (inputs, workers, wage) => {
      const claims = workers * inputs.unempRate;
      return {
        claims,
        baseCost: claims * ((wage * inputs.unempMonths * inputs.unempReplacement) + inputs.unempServiceCost)
      };
    }
  },
  {
    id: 'pension',
    name: 'Old-Age Social Insurance',
    shortName: 'Old-age',
    claimLabel: 'Retiree ratio',
    contributionLabel: 'Old-age contribution',
    contributionBaseLabel: 'payroll',
    setupLabel: inputs => `${pct(inputs.pensionReplacement)} average wage pension`,
    getClaimRate: inputs => inputs.retireeRatio,
    calculate: (inputs, workers, wage) => {
      const claims = workers * inputs.retireeRatio;
      return {
        claims,
        baseCost: claims * wage * 12 * inputs.pensionReplacement
      };
    }
  }
];

function projectPolicy(policy, inputs) {
  let accumulatedAmount = 0;
  let cumulativeCost = 0;
  let cumulativeContributions = 0;
  let weightedCost = 0;
  let weightedPayroll = 0;
  const rows = [];

  for (let index = 0; index < inputs.timelineYears; index += 1) {
    const year = inputs.startYear + index;
    const workers = inputs.workers * Math.pow(1 + inputs.workerGrowth, index);
    const wage = inputs.wage * Math.pow(1 + inputs.wageGrowth, index);
    const payroll = workers * wage * 12;
    const contributionBase = policy.getContributionBase?.(inputs, workers, wage) ?? payroll;
    const calculation = policy.calculate(inputs, workers, wage);
    const finalCost = calculation.baseCost * (1 + inputs.margin);
    const contributions = contributionBase * inputs.contributions[policy.id];
    const fundReturnWeight = Math.pow(1 + inputs.fundReturn, inputs.timelineYears - 1 - index);

    accumulatedAmount = (accumulatedAmount * (1 + inputs.fundReturn)) + contributions - finalCost;
    cumulativeCost += finalCost;
    cumulativeContributions += contributions;
    weightedCost += finalCost * fundReturnWeight;
    weightedPayroll += contributionBase * fundReturnWeight;

    rows.push({
      year,
      policy,
      workers,
      wage,
      payroll,
      contributionBase,
      claimRate: policy.getClaimRate(inputs),
      claims: calculation.claims,
      requiredRate: 0,
      contributionRate: inputs.contributions[policy.id],
      setup: policy.setupLabel(inputs),
      finalCost,
      cumulativeCost,
      contributions,
      cumulativeContributions,
      accumulatedAmount
    });
  }

  const rawRequiredRate = weightedPayroll > 0 ? weightedCost / weightedPayroll : 0;
  const requiredRate = Math.ceil(rawRequiredRate * 10000) / 10000;
  rows.forEach(row => {
    row.requiredRate = requiredRate;
  });

  return {
    policy,
    rows,
    final: rows[rows.length - 1]
  };
}

function renderSummary(projectedPolicies, inputs) {
  const finalYear = inputs.startYear + inputs.timelineYears - 1;
  const finalPayroll = inputs.workers *
    Math.pow(1 + inputs.workerGrowth, inputs.timelineYears - 1) *
    inputs.wage *
    Math.pow(1 + inputs.wageGrowth, inputs.timelineYears - 1) *
    12;

  document.getElementById('timelineOut').textContent = `${inputs.startYear}-${finalYear}`;
  document.getElementById('payrollOut').textContent = money(finalPayroll);
  document.getElementById('policyCountOut').textContent = count(projectedPolicies.length);
  document.getElementById('statusOut').textContent = 'Calculated';
}

function renderPolicySections(projectedPolicies) {
  projectedPolicies.forEach((projectedPolicy) => {
    const { policy, final } = projectedPolicy;
    const container = document.getElementById(`${policy.id}Results`);
    const accumulatedTone = accumulatedAmountTone(final.accumulatedAmount, final.finalCost);
    const premiumCoverageTone = final.requiredRate > final.contributionRate ? 'underfunded' : 'covered';

    container.innerHTML = `
      <div class="scheme-result-head">
        <div>
          <span>${outputTitle('Final-year cost', 'def-output-final-year-cost', 'Cost in the last projected year after admin margin.')}</span>
          <strong>${money(final.finalCost)}</strong>
        </div>
        <div class="accumulated-tone-${accumulatedTone}" style="background:${toneBackgrounds[accumulatedTone]}">
          <span>${outputTitle('Accumulated amount', 'def-output-accumulated-amount', 'Projected reserve balance after contributions, costs and fund return.')}</span>
          <strong>${money(final.accumulatedAmount)}</strong>
        </div>
      </div>
      <dl class="metric-list">
        <div class="metric"><dt>${outputTitle(policy.claimLabel, 'def-output-claim-rate', 'The claim-rate assumption used for this scheme.')}</dt><dd>${pct(final.claimRate)}</dd></div>
        <div class="metric"><dt>${outputTitle('Final-year claims', 'def-output-final-year-claims', 'Expected claim count in the last projected year.')}</dt><dd>${count(final.claims)}</dd></div>
        <div class="metric"><dt>${outputTitle('Required premium rate', 'def-output-required-premium-rate', `Rate on ${policy.contributionBaseLabel} needed to keep the final accumulated reserve at zero or above.`)}</dt><dd class="premium-coverage-${premiumCoverageTone}" style="color:${premiumCoverageTextColors[premiumCoverageTone]}">${pct(final.requiredRate)}</dd></div>
        <div class="metric"><dt>${outputTitle(policy.contributionLabel, 'def-output-contribution-rate', `The user-set contribution or premium rate on ${policy.contributionBaseLabel} for this scheme.`)}</dt><dd>${pct(final.contributionRate)}</dd></div>
        <div class="metric"><dt>${outputTitle('Benefit setup', 'def-output-benefit-setup', 'Benefit design settings used in this scheme calculation.')}</dt><dd>${final.setup}</dd></div>
        <div class="metric"><dt>${outputTitle('Cumulative cost', 'def-output-cumulative-cost', 'Total costs across the selected projection timeline.')}</dt><dd>${money(final.cumulativeCost)}</dd></div>
        <div class="metric strong"><dt>${outputTitle('Accumulated amount', 'def-output-accumulated-amount', 'Projected reserve balance after contributions, costs and fund return.')}</dt><dd>${money(final.accumulatedAmount)}</dd></div>
      </dl>
      <div class="table-wrap projection-table-wrap">
        <table class="projection-table">
          <thead>
            <tr>
              <th>${outputTitle('Year', 'def-output-year', 'Calendar year for this projection row.')}</th>
              <th>${outputTitle('Claim rate', 'def-output-claim-rate', 'The claim-rate assumption used for this scheme.')}</th>
              <th>${outputTitle('Claims', 'def-output-claims', 'Expected number of claims in this year.')}</th>
              <th>${outputTitle('Final cost', 'def-output-annual-final-cost', 'Annual scheme cost after admin margin.')}</th>
              <th>${outputTitle('Contributions', 'def-output-contributions', 'Contribution income for this scheme and year.')}</th>
              <th>${outputTitle('Accumulated amount', 'def-output-accumulated-amount', 'Projected reserve balance after contributions, costs and fund return.')}</th>
            </tr>
          </thead>
          <tbody>
            ${renderPolicyRows(projectedPolicy)}
          </tbody>
        </table>
      </div>
    `;
  });
}

function renderPolicyRows(projectedPolicy) {
  return projectedPolicy.rows.map(row => `
    <tr>
      <td>${row.year}</td>
      <td>${pct(row.claimRate)}</td>
      <td>${count(row.claims)}</td>
      <td>${money(row.finalCost)}</td>
      <td>${money(row.contributions)}</td>
      <td>${money(row.accumulatedAmount)}</td>
    </tr>
  `).join('');
}

function runScenario() {
  const inputs = readInputs();
  const projectedPolicies = policies.map(policy => projectPolicy(policy, inputs));

  renderSummary(projectedPolicies, inputs);
  renderPolicySections(projectedPolicies);
}

const calcForm = document.getElementById('calcForm');

if (calcForm) {
  calcForm.addEventListener('submit', event => {
    event.preventDefault();
    runScenario();
  });

  calcForm.addEventListener('input', runScenario);
  runScenario();
}
