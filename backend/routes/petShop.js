const express = require("express");
const Pet = require("../models/pet");

const router = express.Router();

router.get("/pets", async (req, res) => {
  try {
    const { species, sortBy = "name", order = "asc" } = req.query;
    const sortOrder = order === "asc" ? 1 : -1;
    if (species === undefined) {
      const data = await Pet.find().sort({ [sortBy]: sortOrder });
      if (data.length === 0) {
        return res.status(404).json({ message: "No pets found" });
      } else {
        return res.status(200).json({ message: "success", data });
      }
    } else {
      const data = await Pet.find({ species }).sort({ [sortBy]: sortOrder });
      if (data.length === 0) {
        return res.status(404).json({ message: "No pets found" });
      } else {
        return res.status(200).json({ message: "success", data });
      }
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post("/pets", async (req, res) => {
  try {
    const { name, species, age } = req.body;
    if (name.trim().length <= 2) {
      return res
        .status(400)
        .json({ message: "Name must be atleast 2 characters in length" });
    } else if (!["Dog", "Cat", "Rabbit"].includes(species)) {
      return res
        .status(400)
        .json({ message: "Only Dogs, Cats or Rabbits can be enrolled" });
    } else if (age < 0) {
      return res.status(400).json({ message: "Age must be non negative" });
    } else {
      const newPet = new Pet(req.body);
      await newPet.save();
      res.status(201).json({ message: "Pet Added", newPet });
    }
  } catch (error) {
    return res.status(400).json({ message: "Error in creating Pet" });
  }
});
