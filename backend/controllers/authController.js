const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id, role) => {
    return jwt.sign(
        {
            id,
            role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
};

const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
        } = req.body;

        const userExists = await User.findOne({
            email,
        });

        if (userExists) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
        });

        res.status(201).json({
            success: true,
            token: generateToken(
                user._id,
                user.role
            ),
            user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } =
            req.body;

        const user = await User.findOne({
            email,
        });

        if (
            user &&
            (await bcrypt.compare(
                password,
                user.password
            ))
        ) {
            return res.json({
                success: true,
                token: generateToken(
                    user._id,
                    user.role
                ),
                user,
            });
        }

        res.status(401).json({
            success: false,
            message: "Invalid credentials",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(
            req.user.id
        ).select("-password");

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    register,
    login,
    getMe,
};