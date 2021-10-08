import cheerio from "cheerio";
import fetch from "node-fetch";

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
  for(let i = 0; i<7; i++){
    contributions.push(day.attr('data-count'));
    day = day.prev();
  }
  return contributions.reverse();
}
