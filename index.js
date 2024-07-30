import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import fs from "fs";

const app = express();
const port = 3000;
const apiURL = "https://api.mangadex.org";
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

var searchCache = {};

// Retrieves chapter data and downloads chapter
// Then renders pages downloaded
app.get("/view/chapter/:chapterId", async (req, res) => {
  let chapterId = req.params.chapterId;
  /*
    Get Chapter metadata
  */
  const chapter = await axios.get(apiURL + "/at-home/server/" + chapterId);
  const host = chapter.data.baseUrl;
  const chapterHash = chapter.data.chapter.hash;
  const data = chapter.data.chapter.data; // Array of page file names
  const dataSaver = chapter.data.chapter.dataSaver; // Array of page file names
  var endPoint = `${host}/data/${chapterHash}/`;

  /*
    Download Chapter pages
  */
  const folderPath = `public/chapters/${chapterId}`;
  var pages = [];
  fs.mkdirSync(folderPath, { recursive: true });
  for (const page of data) {
    const pageObj = await axios.get(endPoint + page, {
      responseType: "arraybuffer",
    });
    pages.push(`/chapters/${chapterId}/${page}`);
    fs.writeFileSync(`${folderPath}/${page}`, pageObj.data);
  }
  console.log(`Downloaded ${data.length} pages.`);
  res.render("viewChapter.ejs", { chapter: pages });
});

// Retrieves metadata of manga and displays it
app.get("/view/:mangaId", async (req, res) => {
  const mangaId = req.params.mangaId;

  try {
    var manga;
    // Load manga from search cache if possible
    if (mangaId in searchCache) {
      console.log("Retrieving manga from cache");
      manga = searchCache[mangaId];
    } else {
      console.log("Retrieving manga from mangaDex API ");
      const response = await axios.get(apiURL + "/manga/" + mangaId);
      manga = response.data.data;
      searchCache[mangaId] = manga; // Adds manga obj to manga cache
    }
    var feed = await axios.get(apiURL + "/manga/" + mangaId + "/feed", {
      params: {
        limit: 10,
        translatedLanguage: ["en"],
        order: { chapter: "asc" },
      },
    });
    var chapters = feed.data.data;

    res.render("view.ejs", { mangaData: manga, chaptersData: chapters });
  } catch (error) {
    console.error(error.response.data);
    res.render("view.ejs", {
      errorMessage: JSON.stringify(error.response.data.errors),
    });
  }
});

// Retrieves metadata of manga that fit the search result
app.get("/search", async (req, res) => {
  // Clear cache before each search
  for (var id in searchCache) delete searchCache[id];
  const mangaTitle = req.query.title;
  try {
    const response = await axios.get(apiURL + "/manga", {
      params: { title: mangaTitle },
    });
    // The API returns a list called 'data' that contains the list of manga objects
    const searchResults = response.data.data;
    // Cache IDs and Manga objects from search results
    searchResults.forEach((manga) => {
      let id = manga["id"];
      searchCache[id] = manga;
    });
    // The api returns 'total' which is the length of the 'data' list
    const resultNumber = response.data.total;
    res.render("search.ejs", { mangaList: searchResults, total: resultNumber });
  } catch (error) {
    console.error(error);
  }
});

app.get("/", (req, res) => {
  res.render("search.ejs");
});

app.listen(port, () => {
  console.log(`Server is running on Port ${port}`);
});
