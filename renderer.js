// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const { app, BrowserWindow, ipcRenderer } = require("electron");
const { Dexie } = require("Dexie");
fs = require("fs");

console.log(123);
var db = new Dexie("cache");
db.version(1).stores({
  terms: "++id,word,type,origin,html",
});
var mdict = new Dexie("mdict");
mdict.version(1).stores({
  terms: "++id,word,type,origin,html",
});
// setTimeout(() => {
//   readTextFile(
//     "file:///Users/tong/Downloads/demo_dict/New Oxford American Dictionary 3rd/New Oxford American Dictionary, 3rd Edition.txt"
//   );
// }, 5000);
saveTextFile(
  "file:///Users/tong/Downloads/demo_dict/New Oxford American Dictionary 3rd/New Oxford American Dictionary, 3rd Edition.txt"
);

var _ = document.querySelectorAll;
document
  .querySelectorAll(".word")[0]
  .addEventListener("keyup", function (event) {
    event.preventDefault();
    if (event.keyCode === 13) {
      document.querySelectorAll(".searchBtn")[0].click();
    }
  });
document.querySelectorAll(".addMetaBtn")[0].addEventListener("click", () => {
  var $term = document.querySelectorAll(".term")[0];
  const word = document.querySelectorAll(".word")[0].value.trim();
  document
    .querySelectorAll(".term")[0]
    .insertBefore(
      createElementFromHTML(`<p><img src='./data/${word}.png'></p>`)[0],
      $term.childNodes[1]
    );
  saveTerm();
});
document
  .querySelectorAll(".searchBtn")[0]
  .addEventListener("click", async function (t, e) {
    console.log(t, e);
    const word = document.querySelectorAll(".word")[0].value.trim();
    (async () => {
      console.log(345);
      document.querySelectorAll(".matches")[0].innerHTML = "";
      var cmd =
        document.querySelectorAll(".rga")[0].value.trim() +
        " ' " +
        word +
        "' " +
        document.querySelectorAll(".paras")[0].value.trim();
      console.log(cmd);

      const result = await ipcRenderer.invoke("my-invokable-ipc", cmd);
    })();
    try {
      // await db.friends.add({name: "Josephine", age: 21});
      const records = await mdict.terms
        .where("word")
        .equalsIgnoreCase(word)
        .toArray();

      console.log(records);
      var record = records[0];
      $term = document.querySelectorAll(".term")[0];
      $term.innerHTML = records[0].html;
      $term.setAttribute("data-id", records[0].id);
    } catch (e) {
      alert(`Error: ${e}`);
    }
    var $multiChoice = document.querySelectorAll(".multiChoice")[0];
    $multiChoice.innerHTML = "";

    console.log(record);
    if (!record) {
      return;
    }
    var right = (
      await db.terms.where("word").equalsIgnoreCase(word).toArray()
    )[0];
    if (!right) {
      return;
    }
    var wrongs = await db.terms
      .filter(function (term) {
        return (
          /.*?<span class="ex situation">.*/.test(term.html) &&
          term.word !== record.word &&
          term.type == record.type
        );
      })
      .limit(3)
      .toArray();
    console.log(wrongs);
    wrongs.push(right);
    shuffle(wrongs);
    wrongs.forEach((wrong) => {
      $multiChoice.appendChild(generateOption(wrong));
    });
  });

ipcRenderer.on("asynchronous-message", function (evt, message) {
  console.log(message); // Returns: {'SAVED': 'File Saved'}

  main(message);
});
function main(message) {
  var result = readJsonLines(message);
  // console.log(result);
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
          /(\d\d)?:?(\d\d):(\d\d).(\d\d\d)/g,
          function (match, p1, p2, p3, p4) {
            // console.log(match, p1, p2, p3);
            let location = +(p1 || 0) * 60 * 60 + +p2 * 60 + +p3;
            // location = location - 5 > 0 ? location - 5 : 0;
            return `<a href="sioyek://${c.data.path.text.replace(
              "srt",
              "mp4"
            ).replace(
              "mkv",
              "mp4"
            )}#${location}">${
              (p1 || 0) + ":" + p2 + ":" + p3
            }</a><button class="saveBtn">Save</button>`;
          }
        );
        // console.log(text);
        text = text
          .replace(/\: (\w.*)/g, ': <span class="situation">$1</span>')
          .replace(/(^\w.*)/g, '<span class="situation">$1</span>');
        // console.log(text);
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
  // console.log(html);
  if (html == "") {
    return;
  }
  var nodes = createElementFromHTML(html);
  // nodes = nodes.length > 0 ? nodes : [nodes];
  nodes.forEach((node) => {
    node.querySelectorAll(".saveBtn").forEach(function (saveBtn) {
      saveBtn.addEventListener("click", async function (e) {
        console.log(e);

        var container = this.parentNode.parentNode;
        var span = container
          .querySelector(".text")
          .innerHTML.replaceAll('<button class="saveBtn">Save</button>', "")
          .replace(/<span class="situation">.*<\/span>/g, "");
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
        // container = container.nextElementSibling;
        do {
          var $situation = container.querySelector(".situation");
          if ($situation) {
            subtitle += " " + $situation.innerText
          }
          
          container = container.nextElementSibling;
        } while (
          container &&
          container.querySelector(".situation") &&
          container.querySelector(".situation").innerText.replace(" ", "") != ""
        ) 
        console.log(span, path, start, end, subtitle);
        var $term = document.querySelectorAll(".term")[0];
        var $example = document.querySelectorAll(".term .m1")[3];
        $term.insertBefore(
          createElementFromHTML(
            `<div class="m1"><div class="opt"><span class="ex situation">${subtitle}<br><span class="span">${span}</div> <span class="path">${path.replace(
              /.*\/(.*)/,
              "$1"
            )}</span></div></div>`
          )[0],
          $example
        );
        this.innerText = "success";
        saveTerm();
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

function readTextFile(file) {
  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", file, false);
  rawFile.onreadystatechange = function () {
    if (rawFile.readyState === 4) {
      if (rawFile.status === 200 || rawFile.status == 0) {
        var allText = rawFile.responseText.replaceAll(
          "<img src='",
          "<img src='/data"
        );
        var term = "";
        var chars = allText.split("");
        for (var i = 0; i < chars.length; i++) {
          term += chars[i];
          if (term.endsWith("</>")) {
            term = term.trim();
            if (term.startsWith("\r\n")) {
              term.replace("\r\n", "").trim();
            }
            console.log(term);
            var parts = term.split("\r\n");
            // console.log(parts);
            var word = parts[0];
            var html = parts[1];
            var nodes = createElementFromHTML(html);
            var $type = nodes[0].parentNode.querySelectorAll(".m1 .p")[0];
            var type = ($type && $type.innerText) || "";
            var $opt = nodes[nodes.length - 1].querySelectorAll(".opt");
            var origin = $opt.length > 0 ? $opt[0].innerHTML || "" : "";
            console.log({ word, html, type, origin });
            (async function () {
              await mdict.terms
                .add({ word, html, type, origin })
                .catch(function (e) {
                  alert("Error: " + (e.stack || e));
                });
            })();

            // console.log(term);
            term = "";
          }
          if (i > 10000000) {
            // return;
          }
        }
        console.log(allText[0]);
      }
    }
  };
  rawFile.send(null);
}

async function saveTextFile(file) {
  let allText = "";
  const records = await mdict.terms.orderBy("id").each((term) => {
    console.log(term);
    allText += term.word + "\r\n" + term.html + "\r\n" + "</>" + "\r\n";
  });
  responseText = allText.replaceAll("<img src='./data", "<img src='");
  fs.writeFile('helloworld.txt', responseText, function (err) {
    if (err) return console.log(err);
    console.log('Hello World > helloworld.txt');
  });
}

function situation2paras($situation) {
  var path, start, end;
  $situation.querySelectorAll("a").forEach(function (link, index) {
    var parts = link.getAttribute("href").split("#");
    path = parts[0].replace("sioyek://", "");
    if (index === 0) {
      start = +parts[1];
    } else {
      end = +parts[1];
    }
  });
  return { path, start, end };
}

function generateOption(record) {
  console.log(record);
  // await db.friends.add({name: "Josephine", age: 21});
  $situation = createElementFromHTML(
    record.html
  )[0].parentNode.querySelectorAll(".m1")[3];
  // var $links = $term.querySelectorAll('.situation a').map(($link)=>$link.getAttribute("href"));
  console.log($situation);
  var paras = situation2paras($situation);
  // alert (`My young friends: ${JSON.stringify(youngFriends)}`);
  // Do something with the request.result!
  var $option = createElementFromHTML(`<div class="option">
       <video data-start="${paras.start}" data-end="${
    paras.end
  }" autoplay muted>
         <source src="file://${paras.path}">
         <source src="file://${paras.path && paras.path.replace("mp4", "mkv")}">
       </video>
       <div class="subtitle">
       ${$situation.innerHTML.replace(record.word, "****")}
       </div>
       </div>
       `)[0];
  $option.querySelectorAll("video").forEach((video) => {
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
      // console.log("The currentTime attribute has been updated. Again.");
    });
  });
  return $option;
}

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

async function saveTerm() {
  var $term = document.querySelectorAll(".term")[0];
  var id = +$term.getAttribute("data-id");
  console.log($term.getAttribute("data-id"), { html: $term.innerHTML });

  // console.log(updated);
  var term = await mdict.terms.get(id);
  term.html = $term.innerHTML;
  db.terms.put(term, id).catch(function (e) {
    alert("Error: " + (e.stack || e));
  });
  mdict.terms.update(+$term.getAttribute("data-id"), { html: $term.innerHTML });
}
