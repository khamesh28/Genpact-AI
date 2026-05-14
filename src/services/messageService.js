import api from './api';

const messageService = {
  getMessages: (teamId, params = {}) =>
    api.get(`/teams/${teamId}/messages`, { params }).then(r => r.data),

  sendMessage: (teamId, content) =>
    api.post(`/teams/${teamId}/messages`, { content }).then(r => r.data),

  deleteMessage: (teamId, messageId) =>
    api.delete(`/teams/${teamId}/messages/${messageId}`).then(r => r.data),
};

export default messageService;
