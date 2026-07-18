import './style.css';

function setupMobileNav(): void {
  const toggle = document.getElementById('navToggle');
  const panel = document.getElementById('navMobilePanel');
  if (!toggle || !panel) return;

  toggle.addEventListener('click', () => {
    const open = panel.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  panel.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'A') {
      panel.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function setupScrollNav(): void {
  const nav = document.getElementById('siteNav');
  if (!nav) return;

  const SCROLL_THRESHOLD = 8;
  let ticking = false;

  const applyScrollState = (): void => {
    nav.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD);
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(applyScrollState);
    },
    { passive: true },
  );

  applyScrollState();
}

function setupApiTabs(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.api-tab'));
  const panels = Array.from(document.querySelectorAll<HTMLElement>('.api-code'));
  if (tabs.length === 0 || panels.length === 0) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const lang = tab.dataset['lang'];
      if (!lang) return;

      tabs.forEach((t) => {
        const isActive = t === tab;
        t.classList.toggle('is-active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      panels.forEach((panel) => {
        panel.hidden = panel.dataset['lang'] !== lang;
      });
    });
  });
}

interface RouteScenario {
  distance: string;
  label: string;
  passes: string;
  path: string;
}

const ROUTE_SCENARIOS: { viaSuez: RouteScenario; viaCapeOfGoodHope: RouteScenario } = {
  viaSuez: {
    distance: '20,651',
    label: 'km — via Suez Canal',
    passes: '1',
    path: 'M40,108 C190,30 400,30 560,80',
  },
  viaCapeOfGoodHope: {
    distance: '26,418',
    label: 'km — via Cape of Good Hope',
    passes: '0',
    path: 'M40,108 C150,130 320,132 420,60 C470,26 520,40 560,80',
  },
};

function setupRouteDemo(): void {
  const toggle = document.getElementById('avoidSuezToggle');
  const distanceEl = document.getElementById('routeDistance');
  const labelEl = document.getElementById('routeDistanceLabel');
  const passesEl = document.getElementById('routePasses');
  const pathEl = document.getElementById('routePath');
  if (!(toggle instanceof HTMLInputElement) || !distanceEl || !labelEl || !passesEl || !pathEl)
    return;

  toggle.addEventListener('change', () => {
    const scenario = toggle.checked ? ROUTE_SCENARIOS.viaCapeOfGoodHope : ROUTE_SCENARIOS.viaSuez;
    distanceEl.textContent = scenario.distance;
    labelEl.textContent = scenario.label;
    passesEl.textContent = scenario.passes;
    pathEl.setAttribute('d', scenario.path);
  });
}

setupMobileNav();
setupScrollNav();
setupApiTabs();
setupRouteDemo();
