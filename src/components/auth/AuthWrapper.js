/**
 * NFAEP Authentication Wrapper
 * Handles authentication state and provides auth context
 */

import React, { useState, useEffect, createContext, useContext } from 'react';

// Create auth context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication status
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // TODO: Replace with real Amplify Auth
      // const currentUser = await getCurrentUser();
      // const session = await fetchAuthSession();
      // const groups = session.tokens?.accessToken?.payload['cognito:groups'] || [];

      // For now, use mock authentication
      const mockUser = {
        username: 'demo-user',
        email: 'demo@nfaep.gov.au'
      };

      const mockGroups = ['Agents']; // or ['FieldLeaders', 'Admins']

      setUser(mockUser);
      setUserGroups(mockGroups);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  const signIn = async (username, password) => {
    try {
      // TODO: Replace with real Amplify Auth
      // const result = await signIn({ username, password });

      // Mock sign in
      setUser({ username, email: `${username}@nfaep.gov.au` });
      setUserGroups(['Agents']);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      console.error('Sign in failed:', error);
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      // TODO: Replace with real Amplify Auth
      // await signOut();

      setUser(null);
      setUserGroups([]);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const isFieldLeader = userGroups.includes('FieldLeaders');
  const isAdmin = userGroups.includes('Admins');

  const value = {
    user,
    userGroups,
    isAuthenticated,
    authChecked,
    loading,
    isFieldLeader,
    isAdmin,
    signIn,
    signOut,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
