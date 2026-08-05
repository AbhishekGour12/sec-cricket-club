import User, { UserAttributes, UserCreationAttributes } from '../models/User';
import { logger } from '../../utils/logger';

export class AuthService {
  /**
   * Find a user by their Firebase UID.
   */
  public static async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    try {
      return await User.findOne({ where: { firebase_uid: firebaseUid } });
    } catch (error) {
      logger.error(`Error finding user by firebase_uid ${firebaseUid}:`, error);
      throw error;
    }
  }

  /**
   * Find a user by their Email address.
   */
  public static async findByEmail(email: string): Promise<User | null> {
    try {
      return await User.findOne({ where: { email } });
    } catch (error) {
      logger.error(`Error finding user by email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Create a new user with Google login details.
   */
  public static async createUser(userData: UserCreationAttributes): Promise<User> {
    try {
      return await User.create({
        status: 'active', // Active immediately upon Google login
        ...userData,
        is_profile_completed: false,
      });
    } catch (error) {
      logger.error('Error creating user in database:', error);
      throw error;
    }
  }

  /**
   * Update an existing user profile details.
   */
  public static async updateUser(userId: number, updateData: Partial<UserAttributes>): Promise<User | null> {
    try {
      const user = await User.findByPk(userId);
      if (!user) return null;
      return await user.update(updateData);
    } catch (error) {
      logger.error(`Error updating user ID ${userId}:`, error);
      throw error;
    }
  }
}

export default AuthService;
