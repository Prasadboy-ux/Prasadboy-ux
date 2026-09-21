import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export const ACTIVITY_START = "<!-- AUTO:ACTIVITY:START -->";
export const ACTIVITY_END = "<!-- AUTO:ACTIVITY:END -->";
export const ANALYTICS_START = "<!-- AUTO:ANALYTICS:START -->";
export const ANALYTICS_END = "<!-- AUTO:ANALYTICS:END -->";

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function renderTechStack(techStack) {
  const knownLanguages = ["HTML", "CSS", "JavaScript", "Python", "TypeScript", "Java", "C++", "C#", "Ruby", "Go", "Rust", "PHP", "Swift", "Kotlin", "SQL", "R", "MATLAB", "Scala", "Dart", "Shell", "Bash"];
  const knownEditors = ["VS Code", "Visual Studio", "IntelliJ", "Sublime Text", "Atom", "Vim", "Emacs", "Notepad++", "Git", "GitHub", "GitLab", "Docker", "Postman", "Jira", "Confluence"];

  const languages = [];
  const editors = [];
  const tools = [];

  for (const item of techStack) {
    const lower = item.toLowerCase();
    if (knownLanguages.some((lang) => lower.includes(lang.toLowerCase()))) {
      languages.push(item);
    } else if (knownEditors.some((editor) => lower.includes(editor.toLowerCase()))) {
      editors.push(item);
    } else {
      tools.push(item);
    }
  }

  const parts = [];
  if (tools.length > 0) parts.push(`Tools:      ${tools.join(" · ")}`);
  if (languages.length > 0) parts.push(`Languages:  ${languages.join(" · ")}`);
  if (editors.length > 0) parts.push(`Editors:    ${editors.join(" · ")}`);

  return parts.join("\n");
}

function renderTypingSvg(username, config) {
  const lines = [
    `${config.profile.headline} @ ${config.profile.affiliation}`,
    config.research.themes,
    config.profile.status,
    config.footer
  ];
  const encoded = lines.map(encodeURIComponent).join(";");
  return `<a href="https://github.com/${username}">
    <img src="https://readme-typing-svg.demolab.com/?font=Fira+Code&weight=600&size=22&pause=1200&color=0A66C2&center=true&vCenter=true&multiline=true&repeat=true&width=650&height=100&lines=${encoded}" alt="Typing SVG">
  </a>`;
}

function renderLinks(links) {
  return links.map((link) => {
    const logo = link.logo ? `&logo=${encodeURIComponent(link.logo)}&logoColor=white` : "";
    const image = `https://img.shields.io/badge/${badgeSegment(link.label)}-${badgeSegment(link.value)}-${link.color}?style=for-the-badge${logo}`;
    return `  <a href="${link.url}"><img alt="${link.label}" src="${image}"></a>`;
  }).join("\n");
}

function renderFocus(focus) {
  const items = focus.slice(0, 4).map((item) => {
    const icon = item.name.includes("Quality") ? "🏗️" : item.name.includes("Process") ? "📈" : item.name.includes("Inspection") ? "🔬" : "🛠️";
    return `### ${icon} ${item.name}\n${item.description}`;
  });

  const left = items.slice(0, 2).join("\n\n");
  const right = items.slice(2, 4).join("\n\n");

  return `<table>
<tr>
<td width="50%">

${left}

</td>
<td width="50%">

${right}

</td>
</tr>
</table>`;
}

function renderProjects(projects) {
  const cards = projects.slice(0, 4).map((project) => {
    const repoUrl = project.homepage || project.url;
    const badgeLabel = project.homepage ? "VIEW_PROJECT" : "VIEW_REPO";
    return `<td width="50%">

<h3 align="center">${project.name}</h3>
<p align="center">
  <a href="${repoUrl}">
    <img src="https://img.shields.io/badge/${badgeLabel}-0A66C2?style=for-the-badge&logo=github&logoColor=white" alt="${badgeLabel}" />
  </a>
</p>
<p align="center"><em>${project.summary}</em></p>

</td>`;
  });

  const rows = [];
  for (let i = 0; i < cards.length; i += 2) {
    rows.push(`<tr>\n${cards[i]}${cards[i + 1] ? "\n" + cards[i + 1] : ""}\n</tr>`);
  }

  return `<table>\n${rows.join("\n")}\n</table>`;
}

function renderTechStackBadges(techStack) {
  const qualityItems = ["ISO 9001", "ISO 14001", "ISO 45001", "ISO 19011", "SPC", "8D Report", "FMEA", "CAPA", "SmartScope", "Root Cause Analysis", "Quality Assurance", "Quality Control"];
  const qualityBadges = {
    "ISO 9001": { label: "ISO_9001", value: "Quality_Mgmt", color: "0B1220" },
    "ISO 14001": { label: "ISO_14001", value: "Environmental", color: "0B1220" },
    "ISO 45001": { label: "ISO_45001", value: "OH%26S", color: "0B1220" },
    "ISO 19011": { label: "ISO_19011", value: "Auditing", color: "0B1220" },
    "SPC": { label: "SPC", value: "Statistical_Process_Control", color: "0A66C2", logo: "databricks", logoColor: "white", style: "flat-square" },
    "8D Report": { label: "8D", value: "Problem_Solving", color: "0A66C2", logo: "target", logoColor: "white", style: "flat-square" },
    "FMEA": { label: "FMEA", value: "Failure_Mode_Analysis", color: "0A66C2", logo: "codacy", logoColor: "white", style: "flat-square" },
    "CAPA": { label: "CAPA", value: "Corrective_Action", color: "0A66C2", logo: "checkmarx", logoColor: "white", style: "flat-square" },
    "SmartScope": { label: "SmartScope", value: "Precision_Measurement", color: "25D366", logo: "openlayers", logoColor: "white", style: "flat-square" },
    "Root Cause Analysis": { label: "RCA", value: "Root_Cause_Analysis", color: "25D366", logo: "scrutinizerci", logoColor: "white", style: "flat-square" }
  };

  const quality = techStack.filter((item) => qualityItems.includes(item));
  const others = techStack.filter((item) => !qualityItems.includes(item));

  const parts = [];

  if (others.length > 0) {
    const icons = others.slice(0, 6).map((item) => item.toLowerCase().replace(/\s+/g, "")).join(",");
    parts.push(`<p align="center">\n  <img src="https://skillicons.dev/icons?i=${icons}&theme=dark&perline=6" alt="Dev Tools" />\n</p>`);
  }

  const isoBadges = quality.filter((item) => item.startsWith("ISO"));
  const toolBadges = quality.filter((item) => !item.startsWith("ISO"));

  if (isoBadges.length > 0) {
    const badges = isoBadges.map((item) => {
      const b = qualityBadges[item];
      return `  <img alt="${item}" src="https://img.shields.io/badge/${b.label}-${b.value}-${b.color}?style=for-the-badge&logoColor=white">`;
    }).join("\n");
    parts.push(`<p align="center">\n${badges}\n</p>`);
  }

  if (toolBadges.length > 0) {
    const badges = toolBadges.map((item) => {
      const b = qualityBadges[item];
      const logo = b.logo ? `&logo=${b.logo}&logoColor=${b.logoColor}` : "";
      return `  <img alt="${item}" src="https://img.shields.io/badge/${b.label}-${b.value}-${b.color}?style=${b.style || "for-the-badge"}${logo}">`;
    }).join("\n");
    parts.push(`<p align="center">\n${badges}\n</p>`);
  }

  return parts.join("\n\n");
}

function renderBar(value, maxValue, maxBars = 14) {
  const filled = Math.max(1, Math.round((value / maxValue) * maxBars));
  return "\u2588".repeat(filled);
}

function renderProfileOverview(overview) {
  return [
    "| Metric | Value |",
    "| --- | --- |",
    `| 📦 Public Repositories | ${overview.publicRepos} |`,
    `| ⭐ Total Stars | ${overview.totalStars} |`,
    `| 🍴 Total Forks | ${overview.totalForks} |`,
    `| 📝 Total Commits | ${overview.totalCommits.toLocaleString()} |`,
    `| 👥 Followers | ${overview.followers} |`,
    `| 👤 Following | ${overview.following} |`
  ].join("\n");
}

function renderLanguageChart(languages, label) {
  if (!languages || languages.length === 0) {
    return `_No ${label.toLowerCase()} data available._`;
  }

  const maxCount = Math.max(...languages.map((l) => l.count || l.commits || 1));
  const maxBars = 14;

  return languages.map((entry) => {
    const count = entry.count || entry.commits || 0;
    const percentage = entry.percentage || 0;
    const labelText = `${entry.language} \u2003 ${renderBar(count, maxCount, maxBars)} ${percentage}%`;
    return `- \`${labelText}\``;
  }).join("\n");
}

function renderAllPublicRepositories(repositories) {
  if (!repositories || repositories.length === 0) {
    return "_No public repositories found._";
  }

  const header = "| Repository | Language | ⭐ Stars | 🍴 Forks | Updated |";
  const divider = "| --- | --- | ---: | ---: | --- |";
  const rows = repositories.map((repo) => {
    const updated = repo.updatedAt ? new Date(repo.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A";
    return `| [**${escapeCell(repo.name)}**](${repo.url}) | ${escapeCell(repo.language)} | ${repo.stars} | ${repo.forks} | ${updated} |`;
  });

  return [header, divider, ...rows].join("\n");
}

function renderMostStarredRepositories(mostStarred) {
  if (!mostStarred || mostStarred.length === 0) {
    return "_No starred repositories found yet._";
  }

  return mostStarred
    .map((repo, index) => `\`${index + 1}.\` [**${escapeCell(repo.name)}**](${repo.url}) — ⭐ ${repo.stars}`)
    .join("\n");
}

function renderAnalyticsSection(analytics, username) {
  if (!analytics) {
    return `\n${ANALYTICS_START}\n_Analytics data will appear here after running npm run generate:analytics._\n${ANALYTICS_END}\n`;
  }

  const profileOverview = renderProfileOverview(analytics.profileOverview);
  const topLanguagesByRepo = renderLanguageChart(analytics.topLanguagesByRepo, "Top Languages by Repository");
  const topLanguagesByCommit = renderLanguageChart(analytics.topLanguagesByCommit, "Top Languages by Commit Activity");
  const allRepos = renderAllPublicRepositories(analytics.repositories);
  const mostStarred = renderMostStarredRepositories(analytics.mostStarred);

  const externalCards = [
    `<img width="49%" src="https://github-profile-summary-cards.vercel.app/api/cards/productive-time?username=${username}&theme=tokyonight&utcOffset=7" alt="Commits Time" />`,
    `<img width="49%" src="https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=${username}&theme=tokyonight" alt="Contribution Graph" />`
  ].join("\n");

  return [
    "---",
    "",
    "## 📊 GitHub Analytics",
    "",
    "### 📋 Profile Overview",
    "",
    profileOverview,
    "",
    "---",
    "",
    "### 📦 All Public Repositories",
    "",
    allRepos,
    "",
    "---",
    "",
    "### 💻 Top Language by Repository",
    "",
    "> Calculated by counting how many repositories are associated with each primary language.",
    "",
    topLanguagesByRepo,
    "",
    "---",
    "",
    "### 🔥 Top Language by Commit Activity",
    "",
    "> Calculated by summing commit counts across repositories and grouping by repository primary language. A repository's primary language is determined by its largest language bytes on GitHub, not by individual commit contents.",
    "",
    topLanguagesByCommit,
    "",
    "---",
    "",
    "### ⭐ Most Starred Projects",
    "",
    mostStarred,
    "",
    "---",
    "",
    "<p align=\"center\">",
    externalCards,
    "</p>",
    "",
    `${ANALYTICS_START}`,
    "",
    `${ANALYTICS_END}`,
    ""
  ].join("\n");
}

function extractActivity(readme) {
  const startIndex = readme.indexOf(ACTIVITY_START);
  const endIndex = readme.indexOf(ACTIVITY_END);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) return null;
  return readme.slice(startIndex + ACTIVITY_START.length, endIndex).trim();
}

async function readExistingActivity(readmePath) {
  try {
    const existing = await readFile(readmePath, "utf8");
    return extractActivity(existing);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function extractAnalytics(readme) {
  const startIndex = readme.indexOf(ANALYTICS_START);
  const endIndex = readme.indexOf(ANALYTICS_END);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) return null;
  return readme.slice(startIndex + ANALYTICS_START.length, endIndex).trim();
}

async function readExistingAnalytics(readmePath) {
  try {
    const existing = await readFile(readmePath, "utf8");
    return extractAnalytics(existing);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function loadAnalyticsData(readmePath) {
  try {
    const analyticsPath = resolve(readmePath, "..", "assets", "analytics", "analytics.json");
    const raw = await readFile(analyticsPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function generateProfileReadme({ config, manifest, readmePath, analytics }) {
  const username = config.profile.username;
  const existingActivity = await readExistingActivity(readmePath);
  const activity = existingActivity || "_Recent public activity will appear here after the workflow runs._";

  const resolvedAnalytics = analytics || await loadAnalyticsData(readmePath);
  const analyticsSection = renderAnalyticsSection(resolvedAnalytics, username);

  const readme = `<!-- Generated by GitHub Profile Agent Console. Edit profile.config.json, then run npm run generate. -->

<!-- ═══════════════════════════════════ HEADER ═══════════════════════════════════ -->

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0B1220,100:0A66C2&height=200&section=header&text=${encodeURIComponent(config.profile.name)}&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=${encodeURIComponent(`${config.profile.headline} \u2022 ${config.profile.affiliation}`)}&descSize=18&descAlignY=55&descColor=94a3b8" alt="header" width="100%" />
</p>

<!-- ═══════════════════════════════════ HERO BANNER ═══════════════════════════════════ -->

<p align="center">
  <picture>
    <source media="(max-width: 760px) and (prefers-color-scheme: dark)" srcset="./assets/hero/${manifest.assets.mobileDark}">
    <source media="(max-width: 760px)" srcset="./assets/hero/${manifest.assets.mobileLight}">
    <source media="(prefers-color-scheme: dark)" srcset="./assets/hero/${manifest.assets.desktopDark}">
    <source media="(prefers-color-scheme: light)" srcset="./assets/hero/${manifest.assets.desktopLight}">
    <img src="./assets/hero/${manifest.assets.desktopDark}" alt="${config.profile.name} - ${config.profile.headline}" width="100%">
  </picture>
</p>

<!-- ═══════════════════════════════════ SOCIAL BADGES ═══════════════════════════════════ -->

<p align="center">
${renderLinks(config.links)}
</p>

<!-- ═══════════════════════════════════ TYPING SVG ═══════════════════════════════════ -->

<p align="center">
  ${renderTypingSvg(username, config)}
</p>

<p align="center">
  <img alt="Profile views" src="https://komarev.com/ghpvc/?username=${username}&label=Profile%20Views&color=0A66C2&style=for-the-badge">
  &nbsp;
  <img alt="Followers" src="https://img.shields.io/github/followers/${username}?style=for-the-badge&logo=github&color=0B1220&labelColor=0B1220">
  &nbsp;
  <img alt="Stars" src="https://img.shields.io/github/stars/${username}?style=for-the-badge&logo=github&color=0B1220&labelColor=0B1220&affiliations=OWNER">
</p>

---

<!-- ═══════════════════════════════════ ABOUT ME ═══════════════════════════════════ -->

## <img src="https://media.giphy.com/media/WUlplcMpOCEmTGBtBW/giphy.gif" width="30"> &nbsp;About Me

\`\`\`yaml
Name:       ${config.profile.name}
Role:       ${config.profile.headline}
Company:    ${config.profile.affiliation}
Location:   ${config.profile.location}
Focus:      ${config.focus.slice(0, 3).map((item) => item.name).join(" · ")}

Certifications:
  - ISO 9001  (Quality Management)
  - ISO 14001 (Environmental Management)
  - ISO 45001 (Occupational Health & Safety)
  - ISO 19011 (Auditing Management Systems)

${renderTechStack(config.techStack)}
\`\`\`

> *"Quality is not an act, it is a habit."* — Aristotle

---

<!-- ═══════════════════════════════════ CURRENT FOCUS ═══════════════════════════════════ -->

## 🎯 &nbsp;Current Focus

${renderFocus(config.focus)}

---

<!-- ═══════════════════════════════════ TECH STACK ═══════════════════════════════════ -->

## 🧰 &nbsp;Tech Stack & Quality Toolkit

${renderTechStackBadges(config.techStack)}

---

<!-- ═══════════════════════════════════ FEATURED WORK ═══════════════════════════════════ -->

## 🚀 &nbsp;Featured Projects

${renderProjects(config.projects)}

${analyticsSection}

---

<!-- ═══════════════════════════════════ SNAKE ═══════════════════════════════════ -->

## 🐍 &nbsp;Contribution Snake

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/${username}/${username}/output/github-contribution-grid-snake-dark.svg" />
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/${username}/${username}/output/github-contribution-grid-snake.svg" />
    <img alt="Snake eating my contributions" src="https://raw.githubusercontent.com/${username}/${username}/output/github-contribution-grid-snake.svg" width="100%" />
  </picture>
</p>

---

<!-- ═══════════════════════════════════ RESEARCH ═══════════════════════════════════ -->

## 🔬 &nbsp;Research Direction

<blockquote>

${config.research.narrative}

</blockquote>

---

<!-- ═══════════════════════════════════ ACTIVITY ═══════════════════════════════════ -->

## ⚡ &nbsp;Recent Activity

${ACTIVITY_START}
${activity}
${ACTIVITY_END}

---

<!-- ═══════════════════════════════════ FOOTER ═══════════════════════════════════ -->

<p align="center">
  <img src="https://quotes-github-readme.vercel.app/api?type=horizontal&theme=tokyonight" alt="Random Dev Quote" />
</p>

<p align="center">
  <b>${escapeCell(config.footer)}</b>
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0A66C2,100:0B1220&height=120&section=footer" alt="footer" width="100%" />
</p>
`;

  await writeFile(resolve(readmePath), readme);
  return readme;
}
