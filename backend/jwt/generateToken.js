import jwt from "jsonwebtoken";

const createTokenAndSaveCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_TOKEN, {
    expiresIn: "10d",
  });
  localStorage.setItem("ChatApp", JSON.stringify({ userId, token }));
  res.cookie("jwt", token, {
    httpOnly: true, // xss
    secure: true,
    sameSite: "strict", // csrf
  });
};
export default createTokenAndSaveCookie;
