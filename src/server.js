const app = require("./app");

const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
  if (err) {
    console.error(err);
  }

  console.log(`Server running on PORT ${PORT}...`);
});
