// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const { app, BrowserWindow, ipcRenderer } = require("electron");
console.log(123);
var $ = document.querySelectorAll;

document
  .querySelectorAll(".searchBtn")[0]
  .addEventListener("click", function (t, e) {
    console.log(t, e);
    (async () => {
      document.querySelectorAll(".matches")[0].innerHTML = "";

      const result = await ipcRenderer.invoke(
        "my-invokable-ipc",
        document.querySelectorAll("input")[0].value
      );
      // ...
    })();
    const transaction = db.transaction(["customers"]);
    const objectStore = transaction.objectStore("customers");
    const request = objectStore.get(1);
    request.onerror = (event) => {
      // Handle errors!
    };
    request.onsuccess = (event) => {
      // Do something with the request.result!
      console.log(request.result);
      var record = request.result;
      var multiChoice = createElementFromHTML(`<div class="multiChoice">
    <video data-start="${record.start}" data-end="${record.end}" autoplay>
      <source src="file://${record.path}">
      <source src="file://${record.path.replace("mp4", "mkv")}">
    </video>
    <div class="subtitle">${record.subtitle}<div class="span">${
        record.span
      }</div></div>
  </div>`)[0];
      multiChoice.querySelectorAll("video").forEach((video) => {
        var start = +video.getAttribute("data-start"),
          end = +video.getAttribute("data-end");
        video.addEventListener("loadedmetadata", function (event) {
          console.log(event);
          video.currentTime = start;
        });
        video.addEventListener("timeupdate", (event) => {
          //   console.log(event);
          if (video.currentTime > end) {
            video.currentTime = start;
            // video.play();
          }
          console.log("The currentTime attribute has been updated. Again.");
        });
      });
      document.querySelectorAll(".multiChoice")[0].replaceWith(multiChoice);
    };
  });
const dbName = "the_name";

let db;
const request = indexedDB.open(dbName, 2);

request.onerror = (event) => {
  // Handle errors.
};
request.onsuccess = (event) => {
  db = event.target.result;
};
request.onupgradeneeded = (event) => {
  db = event.target.result;

  // Create an objectStore to hold information about our customers. We're
  // going to use "ssn" as our key path because it's guaranteed to be
  // unique - or at least that's what I was told during the kickoff meeting.
  const objectStore = db.createObjectStore("customers", {
    keyPath: "id",
    autoIncrement: true,
  });

  // Create an index to search customers by name. We may have duplicates
  // so we can't use a unique index.
  objectStore.createIndex("subtitle", "subtitle", { unique: false });

  // Create an index to search customers by email. We want to ensure that
  // no two customers have the same email, so use a unique index.
  objectStore.createIndex("path", "path", { unique: false });
};

ipcRenderer.on("asynchronous-message", function (evt, message) {
  console.log(message); // Returns: {'SAVED': 'File Saved'}

  main(message);
});
function main(message) {
  var result = readJsonLines(message);
  console.log(result);
  if (result[0].type === "summary") {
    return;
  }

  var html = `${(function () {
    return result.reduce((p, c) => {
      // console.log(c);
      let html;
      if (c.type == "begin") {
        html = `<div><div class="filename">
        ${c.data.path.text}
      </div><ul>`;
      } else if (c.type == "end") {
        html = `</ul></div>`;
      } else if (c.type == "summary") {
        html = "";
      } else {
        var text = c.data.lines.text.replace(
          /(\d\d):(\d\d):(\d\d).(\d\d\d)/g,
          function (match, p1, p2, p3) {
            console.log(match, p1, p2, p3);
            let location = +p1 * 60 * 60 + +p2 * 60 + +p3;
            // location = location - 5 > 0 ? location - 5 : 0;
            return `<a href="sioyek://${c.data.path.text.replace(
              "srt",
              "mp4"
            )}#${location}">${match}</a><button class="saveBtn">Save</button>`;
          }
        );
        text = text.replace(/Page (\d*)/g, function (match, p1) {
          return `<a href="sioyek://${c.data.path.text}#${p1}">${match}</a>`;
        });

        html = `<li>
          <span class="line_number">${c.data.line_number}</span>
          :<span class="text">${
            c.data.submatches.length > 0
              ? text.replace(
                  c.data.submatches[0].match.text,
                  `<span class="query">${c.data.submatches[0].match.text}</span>`
                )
              : text
          }</span>
          
        </li>`;
      }

      return p + html;
    }, "");
  })()}`;
  console.log(html);
  if (html == "") {
    return;
  }
  var nodes = createElementFromHTML(html);
  // nodes = nodes.length > 0 ? nodes : [nodes];
  nodes.forEach((node) => {
    node.querySelectorAll(".saveBtn").forEach(function (saveBtn) {
      saveBtn.addEventListener("click", function (e) {
        console.log(e);

        var container = this.parentNode.parentNode;
        var span = container
          .querySelector(".text")
          .innerHTML.replaceAll('<button class="saveBtn">Save</button>', "");
        var path, start, end;
        container.querySelectorAll("a").forEach(function (link, index) {
          var parts = link.getAttribute("href").split("#");
          path = parts[0].replace("sioyek://", "");
          if (index === 0) {
            start = +parts[1];
          } else {
            end = +parts[1];
          }
        });
        var subtitle = "";
        container = container.nextElementSibling;
        while (
          container &&
          container.querySelector(".text").innerText.replace(" ", "") != ""
        ) {
          subtitle += " " + container.querySelector(".text").innerText;
          container = container.nextElementSibling;
        }
        console.log(span, path, start, end, subtitle);
        const customerObjectStore = db
          .transaction("customers", "readwrite")
          .objectStore("customers");
        customerObjectStore.add({
          subtitle,
          path,
          span,
          start,
          end,
        });

        this.innerText = "success";
      });
    });
    setTimeout(function () {
      document.querySelectorAll(".matches")[0].appendChild(node);
    }, 10);
  });
}

function readJsonLines(jsonl) {
  return jsonl.split(/(?<=})\n(?={)/).map((jsonStr, index) => {
    // console.log(jsonStr);
    if (jsonStr[jsonStr.length - 1] !== "}") {
      jsonStr = jsonStr.slice(0, -1);
    }

    const match = JSON.parse(
      jsonStr.replaceAll("\n", "\\n").replaceAll("\r", "\\r")
    );
    // console.log(index, match);
    return match;
  });
}

function createElementFromHTML(htmlString) {
  var div = document.createElement("div");
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes.
  return div.childNodes;
}
