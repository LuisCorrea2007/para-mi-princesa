const prisma = require('../config/database');

// Get all settings for current user
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await prisma.setting.findMany({
      where: { userId: req.user.id }
    });
    
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    
    res.json({ settings: settingsObj });
  } catch (error) {
    next(error);
  }
};

// Update multiple settings
exports.updateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    
    const updates = Object.entries(settings).map(([key, value]) => 
      prisma.setting.upsert({
        where: {
          userId_key: {
            userId: req.user.id,
            key
          }
        },
        update: { value },
        create: {
          userId: req.user.id,
          key,
          value
        }
      })
    );
    
    await Promise.all(updates);
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Get single setting
exports.getSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    
    const setting = await prisma.setting.findUnique({
      where: {
        userId_key: {
          userId: req.user.id,
          key
        }
      }
    });
    
    res.json({ 
      key, 
      value: setting ? setting.value : null 
    });
  } catch (error) {
    next(error);
  }
};

// Update single setting
exports.updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    const setting = await prisma.setting.upsert({
      where: {
        userId_key: {
          userId: req.user.id,
          key
        }
      },
      update: { value },
      create: {
        userId: req.user.id,
        key,
        value
      }
    });
    
    res.json({ message: 'Setting updated', setting });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
