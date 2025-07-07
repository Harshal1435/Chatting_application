import { createContext, useContext, useEffect, useState } from 'react';
import { useSocketContext } from './socket.context'; // Your existing socket context
import { useAuthContext } from './auth.context';
import axios from 'axios';
import { API_URL } from '../utils/constants';

const StatusSocketContext = createContext();

export const StatusSocketProvider = ({ children }) => {
  const [statuses, setStatuses] = useState([]);
  const [contactsStatuses, setContactsStatuses] = useState([]);
  const [myStatus, setMyStatus] = useState(null);
  const { socket } = useSocketContext(); // Reusing your existing socket connection
  const { authUser } = useAuthContext();

  // Join status room when user is authenticated
  useEffect(() => {
    if (socket && authUser) {
      socket.emit('join-status-room');
    }
  }, [socket, authUser]);

  // Setup socket listeners for status updates
  useEffect(() => {
    if (!socket) return;

    const handleNewStatus = (status) => {
      setContactsStatuses(prev => {
        // Check if this user already has a status
        const existingIndex = prev.findIndex(s => s.userId._id === status.userId._id);
        
        if (existingIndex !== -1) {
          // Replace existing status
          const updated = [...prev];
          updated[existingIndex] = status;
          return updated;
        }
        // Add new status
        return [...prev, status];
      });
    };

    const handleStatusViewed = ({ statusId, viewerId }) => {
      if (myStatus?._id === statusId) {
        setMyStatus(prev => ({
          ...prev,
          viewers: [...prev.viewers, { userId: viewerId }]
        }));
      }
    };

    socket.on('new-status', handleNewStatus);
    socket.on('status-viewed', handleStatusViewed);

    return () => {
      socket.off('new-status', handleNewStatus);
      socket.off('status-viewed', handleStatusViewed);
    };
  }, [socket, myStatus]);

  // Fetch initial status data
  const fetchStatuses = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/status`, {
        withCredentials: true
      });
      setStatuses(res.data.statuses);
      setContactsStatuses(res.data.contactsStatuses);
      setMyStatus(res.data.myStatus);
    } catch (error) {
      console.error('Error fetching statuses:', error);
    }
  };

  // Create a new status
  const createStatus = async (file, caption) => {
    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('caption', caption || '');

      const res = await axios.post(`${API_URL}/api/status`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true
      });

      setMyStatus(res.data.status);
      return res.data.status;
    } catch (error) {
      console.error('Error creating status:', error);
      throw error;
    }
  };

  // View a status
  const viewStatus = async (statusId) => {
    try {
      if (!socket || !authUser) return;

      // Optimistic update
      setContactsStatuses(prev => 
        prev.map(status => 
          status._id === statusId 
            ? { ...status, viewers: [...status.viewers, { userId: authUser._id }] } 
            : status
        )
      );

      socket.emit('view-status', { statusId });
    } catch (error) {
      console.error('Error viewing status:', error);
    }
  };

  return (
    <StatusSocketContext.Provider value={{
      statuses,
      contactsStatuses,
      myStatus,
      fetchStatuses,
      createStatus,
      viewStatus
    }}>
      {children}
    </StatusSocketContext.Provider>
  );
};

export const useStatusSocket = () => {
  return useContext(StatusSocketContext);
};