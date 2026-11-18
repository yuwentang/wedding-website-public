const groups = {
  welcome: "迎賓與結婚禮拜",
  ceremony: "迎賓與結婚禮拜",
  banquet: "婚宴與音樂故事",
  music: "婚宴與音樂故事"
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function showText(id, text) {
  if (!text?.trim()) return;
  const node = document.getElementById(id);
  node.textContent = text;
  node.hidden = false;
}

function appendImage(parent, path, alt, isCover = false) {
  if (!path?.startsWith("images/") || !alt?.trim()) return;

  const image = element("img");
  image.alt = alt;
  image.decoding = "async";
  if (isCover) {
    image.fetchPriority = "high";
    image.hidden = true;
    image.addEventListener("load", () => { image.hidden = false; }, { once: true });
  } else {
    image.loading = "lazy";
  }
  image.addEventListener("error", () => image.remove(), { once: true });
  image.src = path;
  parent.append(image);
}

function renderSite(site) {
  if (!site?.couple?.trim()) throw new Error("Missing couple");
  const couple = document.getElementById("couple");
  const names = site.couple.split(" & ");
  if (names.length === 2) {
    couple.replaceChildren(document.createTextNode(names[0] + " "), element("em", "", "&"), document.createTextNode(" " + names[1]));
  } else {
    couple.textContent = site.couple;
  }
  document.title = site.couple + "｜婚禮流程";
  showText("date", site.dateLabel);
  showText("venue", site.venue);
  showText("subtitle", site.title);
  showText("intro", site.intro);
  showText("thanks", site.thanks);
  appendImage(document.getElementById("cover-photo"), site.heroImage, site.heroImageAlt, true);
}

function timeRange(item) {
  const time = element("span", "event-time");
  time.append(element("time", "", item.start));
  if (item.end) time.append("–", element("time", "", item.end));
  return time;
}

function musicStory(item, chapter) {
  const story = element("section", "story");
  const heading = element("h4");
  const chapterLabel = new Intl.NumberFormat("zh-Hant", { numberingSystem: "hanidec" }).format(chapter);
  heading.append(element("span", "story-number", "第" + chapterLabel + "章"), item.chapter);

  const songs = element("ul", "story-songs");
  for (const song of item.songs) {
    songs.append(element("li", "", song));
  }
  story.append(heading, element("p", "story-performer", item.performer));
  if (item.performerBio?.trim()) {
    story.append(element("p", "story-bio", item.performerBio));
  }
  story.append(songs, element("p", "", item.story));
  appendImage(story, item.image, item.imageAlt);
  return story;
}

function eventDetails(item, chapter) {
  const detail = element("div", "event-detail");
  for (const field of ["meaning", "people", "description"]) {
    if (item[field]?.trim()) {
      detail.append(element("p", field === "people" ? "event-people" : "", item[field]));
    }
  }
  if (item.type === "music") detail.append(musicStory(item, chapter));
  return detail;
}

function eventRow(item, chapter) {
  const event = element("li", "event");
  event.id = item.id;
  const detail = eventDetails(item, chapter);
  const expandable = detail.childElementCount > 0;
  const row = element(expandable ? "summary" : "div", "event-row");
  row.append(timeRange(item), element("span", "event-title", item.title));
  if (expandable) {
    const arrow = element("span", "event-arrow");
    arrow.setAttribute("aria-hidden", "true");
    row.append(arrow);
    const details = element("details");
    details.append(row, detail);
    event.append(details);
  } else {
    event.append(row);
  }
  return event;
}

function photoStop(item) {
  const photo = element("section", "photo-stop");
  photo.id = item.id;
  const time = element("p", "photo-time");
  time.append(element("time", "", item.start));
  if (item.end) {
    time.append("–", element("time", "", item.end));
  } else {
    time.append(" ", element("span", "", "起"));
  }
  const heading = element("h2", "", item.title);
  const detail = eventDetails(item);
  if (detail.childElementCount) {
    const summary = element("summary", "photo-summary");
    const arrow = element("span", "event-arrow");
    arrow.setAttribute("aria-hidden", "true");
    summary.append(time, heading, arrow);
    const details = element("details");
    details.append(summary, detail);
    photo.append(details);
  } else {
    photo.append(time, heading);
  }
  return photo;
}

function renderProgram(program) {
  if (!Array.isArray(program?.items) || !program.items.length) throw new Error("Missing program items");

  const timeline = document.createDocumentFragment();
  let previousGroup = "";
  let list;
  let chapter = 0;
  for (const item of program.items) {
    if (item.type === "photo") {
      timeline.append(photoStop(item));
      previousGroup = "";
      continue;
    }
    const group = groups[item.type];
    if (group !== previousGroup) {
      const section = element("section", "program-group content-width");
      list = element("ol", "timeline");
      section.append(element("h3", "group-title", group), list);
      timeline.append(section);
      previousGroup = group;
    }
    if (item.type === "music") chapter += 1;
    list.append(eventRow(item, chapter));
  }
  document.getElementById("events").replaceChildren(timeline);
}

async function load(path, render, statusId, message) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error("HTTP " + response.status);
    render(await response.json());
  } catch (error) {
    showText(statusId, message);
    console.error(path, error);
  }
}

load("./data/site.json", renderSite, "site-error", "婚禮基本資料暫時無法載入。");
load("./data/program.json", renderProgram, "program-error", "婚禮流程暫時無法載入，請稍後重新整理。");
