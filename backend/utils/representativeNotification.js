const RepresentativeNotification = require('../models/RepresentativeNotification');

const createRepresentativeNotification = async ({
  representativeId,
  title,
  message,
  notificationType = 'General/Announcement',
  createdBy,
}) => {
  if (!representativeId || !title || !message) {
    return null;
  }

  return RepresentativeNotification.create({
    representative: representativeId,
    title,
    message,
    notificationType,
    createdBy,
  });
};

module.exports = {
  createRepresentativeNotification,
};
