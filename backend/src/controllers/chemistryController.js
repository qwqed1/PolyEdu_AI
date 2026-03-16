import chemistryService from '../services/chemistryService.js';

const chemistryController = {
  async getCompound(req, res) {
    try {
      const data = await chemistryService.getCompound(req.query.query);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('[Chemistry Controller] getCompound failed:', error.message);
      res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Не удалось получить вещество',
      });
    }
  },

  async getCompoundModel(req, res) {
    try {
      const model = await chemistryService.getCompoundModel(req.params.id);

      res.type('chemical/x-mdl-sdfile').send(model.text);
    } catch (error) {
      console.error('[Chemistry Controller] getCompoundModel failed:', error.message);
      res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Не удалось получить 3D-модель',
      });
    }
  },

  async getReaction(req, res) {
    try {
      const data = await chemistryService.getReaction(req.query.left, req.query.right);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('[Chemistry Controller] getReaction failed:', error.message);
      res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Не удалось получить реакцию',
      });
    }
  },
};

export default chemistryController;
