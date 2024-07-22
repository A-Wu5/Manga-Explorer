import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
const apiURL = "https://api.mangadex.org";
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

var searchCache = {};

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
      manga = response.data;
      searchCache[mangaId] = manga;
    }
    res.render("view.ejs", { mangaData: manga });
  } catch (error) {
    console.error(error.response.data);
    res.render("view.ejs", {
      errorMessage: JSON.stringify(error.response.data.errors),
    });
  }
});

app.get("/search", async (req, res) => {
  // Clear cache before each search
  for (var id in searchCache) delete searchCache[id];
  console.log("cache:", searchCache);
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
