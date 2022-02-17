const fs = require("fs");
const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Tietokannan yhteystiedot
const mysql = require("mysql");
const con = mysql.createConnection({
  host: "localhost",
  user: "*******",
  password: "*******",
  database: "puhelinluettelo",
  multipleStatements: true,
});

// Add headers
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

/*Laitoin yhteyden avaamisen ja lopettamisen omiin metodeihin, koska luulin että voin avata ja sulkea
yhteyden get, post, put ja delete metodien alussa ja lopussa. Tämä ei kuitenkaan toiminut koska
kun yritin esim. get metodin käyttämisen jälkeen lisätä henkilön tietokantaan post metodilla,
niin sain virheilmoituksen että yhteyttä ei ole.*/
function avaaYhteys() {
  con.connect((err) => {
    if (err) {
      console.log("Error connecting to Db");
      return;
    }
    console.log("Connection established");
  });
}

function suljeYhteys() {
  con.end((err) => {});
}

//avataan yhteys
avaaYhteys();

//Hakee tietokannasta kaikkien nimet ja puhelinnumerot
app.get("/henkilot", (req, res) => {
  let luettelo = [];

  con.query("CALL sp_get_henkilot()", function (err, rows) {
    if (err) throw err;

    //Otetaan jokainen yksittäinen henkilö omaksi oliokseen ja laitetaan listaan
    rows[0].forEach((row) => {
      let henkilo = { nimi: row.nimi, puhelin: row.puhelin };
      luettelo.push(henkilo);
    });
    res.json(luettelo);
  });
});

//Hakee yksittäisen henkilön nimen ja puhelinnumeron id:n perusteella
app.get("/henkilot/:henkilo_id", (req, res) => {
  const henkilo_id = req.params.henkilo_id;

  con.query("CALL sp_get_henkilon_tiedot(?)", [henkilo_id], (err, rows) => {
    if (err) throw err;

    console.log("Data received from Db:\n");
    console.log(rows[0]);
    res.json(rows[0]);
  });
});

//Lisää henkilön tietokantaan. id on auto increment joten sitä ei oteta
app.post("/henkilot/insert", (req, res) => {
  let henkilo = req.body;

  con.query(
    "CALL sp_insert_henkilo(?,?)",
    [henkilo.nimi, henkilo.numero],
    (err, rows) => {
      if (err) throw err;

      console.log("Henkilö lisätty: " + henkilo.nimi + ", " + henkilo.numero);
      res.json("Henkilö lisätty: " + henkilo.nimi + ", " + henkilo.numero);
    }
  );
});

//Muuttaa id:n perusteella henkilön nimen ja puhelinnumeron
app.put("/henkilot/update", (req, res) => {
  let henkilo = req.body;
  con.query(
    "CALL sp_update_henkilo(?,?,?)",
    [henkilo.id, henkilo.nimi, henkilo.numero],
    (err, rows) => {
      if (err) throw err;

      console.log(
        "Henkilö päivitetty: " + henkilo.nimi + ", " + henkilo.numero
      );
      res.json("Henkilö päivitetty: " + henkilo.nimi + ", " + henkilo.numero);
    }
  );
});

//Poistaa henkilön tietokannasta id:n perusteella
app.delete("/henkilot/delete", (req, res) => {
  const id = Number(req.body.id);

  con.query("CALL sp_delete_henkilo(?)", [id], (err, rows) => {
    if (err) throw err;

    console.log("Henkilö poistettu");
    res.json("Henkilö poistettu");
  });
});

app.listen(3000, () => {
  console.log("Server listening at port 3000");
});
