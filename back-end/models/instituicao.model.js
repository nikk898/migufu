const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database');

class Instituicao extends Model {}

Instituicao.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    sigla: {
      type: DataTypes.STRING(5),
      allowNull: false,
      unique: true,
    },
    cidade: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    uf: {
      type: DataTypes.CHAR(2),
      allowNull: false,
    },
    ativa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'instituicao',
    timestamps: true,
    createdAt: 'data_criacao',
    updatedAt: 'ultima_atualizacao',
  }
);

module.exports = Instituicao;
