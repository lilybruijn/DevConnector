const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const config = require("config");
const request = require("request");

const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { route } = require("./auth");

// @route   GET api/profile/me
// @descr   Get current users profile
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    );
    if (!profile) {
      return res
        .status(400)
        .json({ msg: "There is no profile for this user." });
    }

    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Server error" });
  }
});

// @route   POST api/profile
// @descr   Create or update user profile
// @access  Private
router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required").notEmpty(),
      check("skills", "Skills is required").notEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      instagram,
      twitter,
      linkedin,
    } = req.body;

    // Build profile object

    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }

    // Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (instagram) profileFields.social.instagram = instagram;
    if (twitter) profileFields.social.twitter = twitter;
    if (linkedin) profileFields.social.youtube = linkedin;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      return res.status(500).send("Server error");
    }
  }
);

// @route   GET api/profile
// @descr   Get all profiles
// @access  Public
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Server error" });
  }
});

// @route   GET api/profile/user/:user_id
// @descr   Get profile by user id
// @access  Public
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);
    if (!profile) {
      return res.status(400).json({ msg: "Profile not found." });
    }
    res.json(profile);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ msg: "Profile not found." });
    }
    console.error(error.message);
    res.status(500).send({ msg: "Server error" });
  }
});

// @route   GET api/profile
// @descr   Delete user, profile and posts
// @access  Private
router.delete("/", auth, async (req, res) => {
  try {
    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    await User.findOneAndRemove({ _id: req.user.id });
    // To do: remove user
    // To do: remove users posts
    res.json({ msg: "User deleted." });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Server error" });
  }
});

// @route   PUT api/profile/experience
// @descr   Add experience to profile
// @access  Private
router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required").notEmpty(),
      check("company", "Company is required").notEmpty(),
      check("from", "From date is required").notEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { title, company, location, from, to, current, description } =
      req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      if (!profile) {
        return res.status(400).send({ msg: "Profile not found." });
      }
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Server error" });
    }
  }
);

// @route   DELETE api/profile/experience/:exp_id
// @descr   Delete experience from profile
// @access  Private
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    // First: get profile by user id (from auth)
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(400).json({ msg: "Profile not found." });
    }
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);
    profile.experience.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Server error" });
  }
});

// @route   PUT api/profile/education
// @descr   Add education to profile
// @access  Private
router.put(
  "/education",
  [
    auth,
    [
      check("school", "School is required").notEmpty(),
      check("degree", "Degree is required").notEmpty(),
      check("fieldofstudy", "Field of study is required").notEmpty(),
      check("from", "From date is required").notEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { school, degree, fieldofstudy, from, to, current, description } =
      req.body;

    const newEducation = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      if (!profile) {
        return res.status(400).send({ msg: "Profile not found." });
      }
      profile.education.unshift(newEducation);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Server error" });
    }
  }
);

// @route   DELETE api/profile/education/:education_id
// @descr   Delete education from profile
// @access  Private
router.delete("/education/:education_id", auth, async (req, res) => {
  try {
    // First: get profile by user id (from auth)
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(400).json({ msg: "Profile not found." });
    }
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.education_id);
    profile.education.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Server error" });
  }
});

// @route   GET api/profile/github/:username
// @descr   Get github by githubusername
// @access  Public
router.get("/github/:username", async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id:${config.get(
        "githubClientId"
      )}&client_secret:${config.get("githubSecret")}`,
      method: "GET",
      headers: { "user-agent": "nodejs" },
    };
    request(options, (error, response, body) => {
      if (error) {
        console.error(error.message);
      }
      if (response.statusCode !== 200) {
        return res.status(400).json({ msg: "No Github profile found." });
      }
      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Server error" });
  }
});

module.exports = router;
