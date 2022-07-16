const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const config = require("config");
const request = require("request");

const Post = require("../../models/Post");
const User = require("../../models/User");
const Profile = require("../../models/Profile");

// @route   GET api/posts
// @descr   Test route
// @access  Public

// @route   POST api/posts
// @descr   Create post
// @access  Private
router.post(
  "/",
  [auth, check("text", "Text is required").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ erros: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select("-password");
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });
      let post = await newPost.save();
      return res.json(post);
    } catch (error) {
      console.error(error.message);
      return res.status(500).send({ msg: "Server error." });
    }
  }
);

// @route   GET api/posts
// @descr   Get all posts
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Server error" });
  }
});

// @route   GET api/posts/:id
// @descr   Get post by post id
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.id });
    if (!post) {
      return res.status(404).json({ msg: "Post not found." });
    }
    res.json(post);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found." });
    }
    console.error(error.message);
    res.status(500).send({ msg: "Server error" });
  }
});

// @route   DELETE api/posts/:id
// @descr   Delete post
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.id });
    // Check if user is the same user that made the post
    if (post.user.toString() !== req.user.id) {
      return res
        .status(401)
        .send({ msg: "User not authorized to delete post." });
    } else {
      await Post.remove(post);
    }
    res.json({ msg: "Post deleted." });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Server error" });
  }
});

// @route   PUT api/posts/like/id
// @descr   Add like to post
// @access  Private
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(400).json({ msg: "Post not found." });
    }
    // Check if post has already been liked by this user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: "Post already liked." });
    }
    post.likes.unshift({
      user: req.user.id,
    });
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Server error" });
  }
});

// @route   PUT api/posts/likes/id
// @descr   Remove like from post
// @access  Private
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(400).json({ msg: "Post not found." });
    }
    // Check if post has already been liked by this user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: "Post not yet been liked." });
    }
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Server error" });
  }
});

// @route   PUT api/posts/comment/id
// @descr   Add comment to post
// @access  Private
router.put(
  "/comment/:id",
  [auth, [check("text", "Text is required.").notEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.id).select("-password");
    const newComment = {
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id,
    };
    try {
      const post = await Post.findOne({ id: req.params.id });
      if (!post) {
        return res.status(400).send({ msg: "Post not found." });
      }
      post.comments.unshift(newComment);
      await post.save();
      res.json(post.comments);
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Server error" });
    }
  }
);

// @route   PUT api/posts/comment/id/comment_id
// @descr   Remove comment from post
// @access  Private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.id });
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );
    if (!comment) {
      return res.status(404).json({ msg: "Comment not found." });
    }
    if (req.user.id !== comment.user.toString()) {
      return res.status(401).json({ msg: "User not authorized." });
    }
    const removeIndex = post.comments
      .map((comment) => comment.id)
      .indexOf(req.params.comment_id);
    post.comments.splice(removeIndex, 1);
    await post.save();
    res.json(post.comments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Server error" });
  }
});

module.exports = router;
