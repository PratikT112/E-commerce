const express = require("express");
const book = require("../models/book");

const router = express.Router();


router.get('/books',async(req,res)=>{
    try {
        const {sortBy='title', order = 'asc'} = req.query;
        const sortOrder = order === 'asc'? 1: -1;
        const books = await book.find().sort({[sortBy]: sortOrder});
        res.status(200).json(books)
    } catch (error) {
        res.status(400).json({message: "Error fetching books", error})        
    }
})

router.patch('/books/:id/review', async(req,res)=>{
  try {
    let {user, comment, rating} = req.body;
    rating = Number(rating);
    if (user===undefined || comment===undefined || rating===undefined){
      return res.status(400).json({message: "User, review and rating are required fields"});
    }
    const book = await book.findById(req.params.id);
    if (!book){
      return res.status(404).json({message: "Book not Found"});
    }
    book.reviews.push({user, rating, comment});
    book.ratings.push(rating);
    await book.save();
    res.status(200).json({message: "Review Added Successfully", review: {user, rating, comment}});
  } catch (error) {
    res.status(400).json({message: error.message})
  }
});

router.patch('/books/:id/rate',async(req,res)=>{
  try {
    let {newRating} = req.body;
    newRating = Number(newRating);
    if (newRating > 5 || newRating < 1){
      return res.status(400).json({message: "rating should be between 1 and 5"});
    }
    const book = await book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({message: "Book not Found"})
    }
    book.ratings.push(newRating);
    await book.save();
    res.status(200).json({message: "Rating added successfully", newRating});
  } catch (error) {
    res.status(400).json({message: "Error adding rating", error: error.message})
  }
});

router.patch('/books/:id/updateStock', async(req,res)=>{
  try {
    const {stockChange} = req.body;
    if (!stockChange){
      return res.status(400).json({message: "Stock change value is required."})
    }
    const book = await book.findById(req.params.id);
    if (!book){
      return res.status(404).json({message: "Book not found"});
    }
    let newStock = book.stock + stockChange;
    newStock = Math.max(0, Math.min(newStock, 100));
    book.stock = newStock;
    await book.save();
    res.status(200).json({message: "Stock updated successfully", newStock})
  } catch (error) {
    res.status(400).json({message: "Error updating stock", error});
  }
})

router.get('/books/topRated', async(req,res)=>{
    try {
        const topRatedBooks = book.aggregate([{
            $match: {
                $expr: {
                    $gte: [{$avg="$ratings"}, 4]
                }
            }
        },
    {
        $sort: {
            avgRating: -1
        }
    }
    ])
    } catch (error) {
        
    }
})


router.get("/", async (req, res) => {
  try {
    if (req.query.title) {
      const data = await book.find({ title: req.query.title });
      res.status(200).json(data);
    } else if (req.query.author) {
      const data = await book.find({ author: req.query.author });
      res.status(200).json(data);
    } else if (req.query.sortBy) {
      let sortQuery = {};
      switch (req.query.sortBy) {
        case "lowerPrice":
          sortQuery.price = 1;
        case "higherPrice":
          sortQuery.price = -1;
        case "lowerStock":
          sortQuery.stock = 1;
        case "higherStock":
          sortQuery.stock = -1;
      }
      const data = await book.find().sort(sortQuery);
      res.status(200).json(data);
    } else {
      const data = await book.find();
      res.status(200).json(data);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = req.body;

    if (data.title.length <= 3) {
      res
        .status(400)
        .json({ message: "Title should have a minimum of three characters" });
    } else if (data.author === "") {
      res.status(400).json({ message: "Author is required" });
    } else if (data.price <= 0) {
      res.status(400).json({ message: "Price cannot be zero or negative" });
    } else if (data.stock < 0) {
      res.status(400).json({ message: "Stock cannot be negative" });
    } else if (
      data.title ||
      data.author ||
      data.genre ||
      data.price ||
      data.stock
    ) {
      const data = new book(req.body);
      await data.save();
      res.status(201).json({ message: "Book Added" });
    }
  } catch (error) {}
});

router.patch("/:id", async (req, res, next) => {
  try {
    const updateData = req.body;
    if (updateData.price !== undefined && updateData.price <= 0) {
      return res
        .status(400)
        .json({ message: "Price cannot be zero or negative" });
    }
    if (updateData.stock !== undefined && updateData.stock < 0) {
      return res.status(400).json({ message: "Stock cannot be negative" });
    }
    const updatedBook = await book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!updatedBook) {
        return res.status(404).json({"Book not found"})
    }
    res.status(200).json({message: "Updated Successfully", updatedBook})
  } catch (error) {
    res.status(500).json({message: "Internal Server Error", error})
  }
});

router.delete('/:id', async(req,res,next)=>{
    try {
        await book.findByIdAndDelete(req.params.id)
        res.status(200).json({message: "Deleted successfully"})
    } catch (error) {
        res.status(400).json({message: "Error deleting product", error: error.message})
    }
})