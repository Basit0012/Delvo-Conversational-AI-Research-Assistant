import { createContext, useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken } from '../api/client';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getToken());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Verify token and fetch current user profile on initial mount
   */
  const loadUser = useCallback(async () => {
    const existingToken = getToken();
    if (!existingToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await api.get('/api/auth/me');
      setUser(data.user);
    } catch (err) {
      console.warn('[AuthContext]: Stored token invalid or expired:', err.message);
      setToken(null);
      setTokenState(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  /**
   * Login user with email and password
   */
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.post('/api/auth/login', { email, password });
      setToken(data.token);
      setTokenState(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register a new user
   */
  const register = async (username, email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.post('/api/auth/register', { username, email, password });
      setToken(data.token);
      setTokenState(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Authenticate with OAuth / Social provider (Google, GitHub, ChatGPT, Apple, GitLab, Bitbucket, Passkey, SAML SSO)
   */
  const socialLogin = async (provider, email, username) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.post('/api/auth/social-login', {
        provider,
        email,
        username,
      });
      setToken(data.token);
      setTokenState(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user and clear stored credentials
   */
  const logout = () => {
    setToken(null);
    setTokenState(null);
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    error,
    login,
    register,
    socialLogin,
    logout,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
