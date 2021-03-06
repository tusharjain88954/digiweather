const express = require("express");
const router = express.Router();
const passport = require("passport");
const pool = require("../db");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const initializePassport = require("../passportConfig");

initializePassport(passport);
router.get("/register", checkAuthenticated, (req, res) => {
  res.render("register.ejs");
});

router.get("/login", checkAuthenticated, (req, res) => {
  // flash sets a messages variable. passport sets the error message
  console.log(req.session.flash.error);
  res.render("login.ejs");
});

router.get("/dashboard", checkNotAuthenticated, async (req, res) => {

  res.render("dashboard");
});
router.get("/weather", checkNotAuthenticated, async (req, res) => {
  console.log(req.isAuthenticated());

  res.render("weather");
});
router.get("/logout", (req, res) => {
  req.logout();
  res.render("index");
});

router.post("/register", async (req, res) => {
  let { name, email, password, password2, role, companyname, registered, phone, city, state, country, address, cost, capacity } = req.body;
  console.log("working ")
  console.log(req.body);
  console.log(req.params)
  let errors = [];

  console.log({
    name,
    email,
    password,
    password2,
    role,
    companyname, registered, phone, city, state, country, address, cost, capacity
  });

  if (!name || !email || !password || !password2 || !role || !companyname) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password must be a least 6 characters long" });
  }

  if (password !== password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("register", { errors, name, email, password, password2 });
  } else {
    hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    // Validation passed
    pool.query(
      `SELECT * FROM users
          WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results.rows);

        if (results.rows.length > 0) {
          errors.push({ message: "Email already registered" });
          console.log("already registered   ", errors);
          return res.render("register", { errors });
        } else {
          pool.query(
            `INSERT INTO users (name, email, password,job_role,company,registered,phone,city,state,country,address,cost,capacity)
                  VALUES ($1, $2, $3, $4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
                  RETURNING id, password`,
            [name, email, hashedPassword, role, companyname, registered, phone, city, state, country, address, cost, capacity],
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);

              req.flash("success_msg", "You are now registered. Please log in");
              res.redirect("/users/login");
            }
          );
        }
      }
    );
  }
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/users/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true,
  })
);

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/users/dashboard");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}

module.exports = router;
