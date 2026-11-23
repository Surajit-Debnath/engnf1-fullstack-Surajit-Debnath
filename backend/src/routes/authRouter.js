require('dotenv').config();
const { Router } = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {authMiddleware}=require("../middleware/authmiddleware")
const User = require("../models/User");
const {
  registerSchema,
  loginSchema,
} = require("../validation/auth.schema");

const authRouter = Router();

const JWT_SECRET = process.env.JWT_AUTH_PASSWORD;

if (!JWT_SECRET) {
  throw new Error("JWT_AUTH_PASSWORD is missing from environment variables");
}

// Remove sensitive fields before returning a user.
const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

// Register
authRouter.post("/register", async (req, res) => {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: validation.error.issues,
      });
    }

    const { name, email, password } = validation.data;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "USER",
    });

    return res.status(201).json({
      message: "Registration successful",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handles duplicate-key errors, including concurrent registrations.
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

// Login
authRouter.post("/login", async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: validation.error.issues,
      });
    }

    const { email, password } = validation.data;

    // Explicitly select passwordHash if your model uses select: false.
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

authRouter.get("/me",authMiddleware,async(req,res)=>{
    try{
        const userId=req.userId.id;
        const resp=await User.find({_id:userId});
        if(!resp){
            return res.status(401).json({
                message:"Not signed in "
            })
        }
        res.json({
          resp
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            message:"Internal Server Error"
        });
    }
})
module.exports = {
  authRouter:authRouter,
};
