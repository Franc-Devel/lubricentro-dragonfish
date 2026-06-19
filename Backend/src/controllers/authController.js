import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) return res.status(401).json({ error: "Credenciales invalidas." });
    res.json({ message: "OK", token: "TOKEN_OK", user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) { res.status(500).json({ error: e.message }); }
};