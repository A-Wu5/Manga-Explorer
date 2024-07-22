import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
const apiURL = "https://api.mangadex.org";
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/search", async (req, res) => {
  const mangaTitle = req.query.title;
  try {
    const response = await axios.get(apiURL + "/manga", {
      params: { title: mangaTitle },
    });
    // The API returns a list called 'data' that contains the list of manga objects
    const searchResult = response.data.data;
    // The api returns 'total' which is the length of the 'data' list
    const resultNumber = response.data.total;
    res.render("search.ejs", { mangaList: searchResult, total: resultNumber });
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
