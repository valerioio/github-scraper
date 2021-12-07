import cheerio from "cheerio";
import fetch from "node-fetch";
import fs from "fs";
import cliProgress from "cli-progress";

const options = {};

async function fetchPage(index) {
  const response = await fetch(
    `https://github.com/orgs/SchoolOfCode/people?page=${index}`,
    options
  );
  const page = await response.text();
  return page;
}

async function getAllUsers() {
  console.log("Fetching users...");
  const users = [];
  let precLength = -1;
  for (let index = 1; precLength < users.length; index++) {
    precLength = users.length;
    const page = await fetchPage(index);
    const $ = cheerio.load(page);
    $(".member-listing-next")
      .find("[data-hovercard-type=user]")
      .each(function (i) {
        const username = $(this).attr("href");
        if (i % 2) users.push(`https://github.com${username}`);
      });
  }
  fs.writeFile(`users.txt`, users.join("\n"), (e) =>
    console.log(e ? "error" : "ok")
  );
  return users;
}

function today() {
  const d = new Date();
  const ymd = [
    d.getFullYear(),
    (d.getMonth() + 1).toString().padStart(2, "0"),
    d.getDate().toString().padStart(2, "0"),
  ];
  return ymd.join("-");
}

async function getWeekContributions(user) {
  const contributions = [];
  const response = await fetch(user);
  const data = await response.text();
  const $ = cheerio.load(data);
  let day = $(`[data-date="${today()}"]`);
  for (let i = 0; i < 7; i++) {
    contributions.push(day.attr("data-count"));
    day = day.prev();
  }
  return contributions.reverse();
}

async function getRepositoriesByProject(projectName) {
  const repositories = [];
  const users = (await getAllUsers()).map(
    (url) => `${url}?tab=repositories&q=${projectName}`
  );
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  console.log("Fetching repositories...");
  bar.start(users.length, 0);
  for (let i = 0; i < users.length; i++) {
    const profile = users[i];
    const response = await fetch(profile);
    const page = await response.text();
    const $ = cheerio.load(page);
    $("a")
      .filter(function () {
        return $(this).attr("itemprop") === "name codeRepository";
      })
      .each(function () {
        const repository = $(this).attr("href");
        repositories.push(`https://github.com${repository}`);
      });
    bar.update(i);
  }
  bar.update(users.length);
  bar.stop();
  return repositories;
}

async function saveRepositories(projectName) {
  const repositories = await getRepositoriesByProject(projectName);
  fs.writeFile(`${projectName}.txt`, repositories.join("\n"), (e) =>
    console.log(e ? "error" : "ok")
  );
  console.log(repositories);
}
