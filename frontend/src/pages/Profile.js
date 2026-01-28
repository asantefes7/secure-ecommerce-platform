import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No token found—please login');
        setLoading(false);
        return;
      }

      try {
        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.get('http://localhost:5001/api/users/profile', config);
        setUser(data);
        setLoading(false);
      } catch (err) {
        toast.error('Failed to load profile');
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <p>Loading profile...</p>;

  if (!user) return <p>No user data</p>;

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>User Profile</h2>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Admin:</strong> {user.isAdmin ? 'Yes' : 'No'}</p>
    </div>
  );
};

export default Profile;