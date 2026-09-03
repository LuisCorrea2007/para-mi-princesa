import api from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  anniversaryDate?: string | null;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  register: async (email: string, password: string, name: string, anniversaryDate?: string) => {
    const response = await api.post<LoginResponse>('/auth/register', {
      email,
      password,
      name,
      anniversaryDate
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password
    });
    return response.data;
  },

  logout: async (refreshToken: string) => {
    const response = await api.post('/auth/logout', { refreshToken });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data;
  },

  updateProfile: async (data: { name?: string; anniversaryDate?: string }) => {
    const response = await api.put<{ user: User }>('/auth/me', data);
    return response.data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post<{ user: User }>('/auth/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteAvatar: async () => {
    const response = await api.delete<{ user: User }>('/auth/me/avatar');
    return response.data;
  }
};

export const notesService = {
  getNotes: async (params?: { category?: string; isFavorite?: boolean; search?: string; page?: number; limit?: number }) => {
    const response = await api.get('/notes', { params });
    return response.data;
  },

  createNote: async (data: { title: string; content: string; category?: string; scheduledDate?: string }) => {
    const response = await api.post('/notes', data);
    return response.data;
  },

  updateNote: async (id: string, data: Partial<typeof data>) => {
    const response = await api.put(`/notes/${id}`, data);
    return response.data;
  },

  deleteNote: async (id: string) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  },

  addReply: async (noteId: string, content: string) => {
    const response = await api.post(`/notes/${noteId}/replies`, { content });
    return response.data;
  },

  toggleFavorite: async (id: string) => {
    const response = await api.post(`/notes/${id}/favorite`);
    return response.data;
  }
};

export const photosService = {
  getPhotos: async (params?: { albumId?: string; isFavorite?: boolean; page?: number; limit?: number }) => {
    const response = await api.get('/photos', { params });
    return response.data;
  },

  uploadPhoto: async (file: File, data?: { caption?: string; albumId?: string }) => {
    const formData = new FormData();
    formData.append('photo', file);
    if (data?.caption) formData.append('caption', data.caption);
    if (data?.albumId) formData.append('albumId', data.albumId);
    
    const response = await api.post('/photos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deletePhoto: async (id: string) => {
    const response = await api.delete(`/photos/${id}`);
    return response.data;
  },

  toggleFavorite: async (id: string) => {
    const response = await api.post(`/photos/${id}/favorite`);
    return response.data;
  }
};

export const eventsService = {
  getEvents: async (params?: { month?: number; year?: number; category?: string }) => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  getUpcomingEvents: async () => {
    const response = await api.get('/events/upcoming');
    return response.data;
  },

  createEvent: async (data: { 
    title: string; 
    date: string; 
    time?: string; 
    location?: string; 
    category?: string;
    description?: string 
  }) => {
    const response = await api.post('/events', data);
    return response.data;
  },

  deleteEvent: async (id: string) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  respondToEvent: async (eventId: string, responseStatus: 'accepted' | 'declined' | 'maybe') => {
    const response = await api.post(`/events/${eventId}/respond`, { responseStatus });
    return response.data;
  }
};

export const wishesService = {
  getWishes: async (params?: { category?: string; isCompleted?: boolean }) => {
    const response = await api.get('/wishes', { params });
    return response.data;
  },

  createWish: async (data: { 
    title: string; 
    description?: string; 
    category?: string; 
    priority?: number;
    budget?: number;
    deadline?: string 
  }) => {
    const response = await api.post('/wishes', data);
    return response.data;
  },

  toggleComplete: async (id: string) => {
    const response = await api.post(`/wishes/${id}/complete`);
    return response.data;
  },

  vote: async (id: string, voteValue: number) => {
    const response = await api.post(`/wishes/${id}/vote`, { voteValue });
    return response.data;
  },

  deleteWish: async (id: string) => {
    const response = await api.delete(`/wishes/${id}`);
    return response.data;
  }
};

export const milestonesService = {
  getMilestones: async () => {
    const response = await api.get('/milestones');
    return response.data;
  },

  createMilestone: async (data: { title: string; description?: string; date: string; photoId?: string }) => {
    const response = await api.post('/milestones', data);
    return response.data;
  },

  deleteMilestone: async (id: string) => {
    const response = await api.delete(`/milestones/${id}`);
    return response.data;
  }
};

export const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  createBackup: async () => {
    const response = await api.post('/admin/backup');
    return response.data;
  },

  exportData: async () => {
    const response = await api.get('/admin/export', { responseType: 'blob' });
    return response.data;
  }
};
