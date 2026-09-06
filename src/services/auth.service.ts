import { User, verifyPassword } from '../models/User'
import { AppError } from '../middleware/errorHandler'
import { signAuthToken } from '../utils/jwt'
import type { UserRole } from '../types'

export interface AuthUserDTO {
  username: string
  role: UserRole
}

export async function login(
  username: string,
  password: string,
): Promise<{ token: string; user: AuthUserDTO }> {
  const normalizedUsername = username.trim().toLowerCase()

  if (!normalizedUsername || !password) {
    throw new AppError('Username and password are required', 400)
  }

  const user = await User.findOne({ username: normalizedUsername }).select('+passwordHash').exec()

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new AppError('Invalid credentials', 401)
  }

  const token = signAuthToken({
    sub: user._id.toString(),
    username: user.username,
    role: user.role,
  })

  return {
    token,
    user: {
      username: user.username,
      role: user.role,
    },
  }
}
