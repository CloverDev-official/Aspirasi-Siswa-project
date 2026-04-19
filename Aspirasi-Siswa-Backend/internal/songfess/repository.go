package songfess

import (
	"fmt"
	"strings"

	"gorm.io/gorm"
)

type ListQuery struct {
	Page     int
	Limit    int
	From     string
	To       string
	SongName string
	Query    string
	Year     int
	Month    int
}

type ListResult struct {
	Items []Songfess
	Total int64
	Page  int
	Limit int
}

type Repository interface {
	FindAll(query ListQuery) (ListResult, error)
	FindByID(id uint) (Songfess, error)
	FindByIDs(ids []uint) ([]Songfess, error)
	Create(songfess Songfess) (uint, error)
	Update(songfess Songfess) error
	Delete(id uint) error
	DeleteMany(ids []uint) (int64, error)
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *repository {
	return &repository{db}
}

func (r *repository) FindAll(query ListQuery) (ListResult, error) {
	page := query.Page
	if page < 1 {
		page = 1
	}

	limit := query.Limit
	if limit <= 0 {
		limit = 10
	}

	if limit > 100 {
		limit = 100
	}

	qb := r.db.Model(&Songfess{})

	from := strings.TrimSpace(query.From)
	if from != "" {
		like := fmt.Sprintf("%%%s%%", from)
		qb = qb.Where("`from` LIKE ?", like)
	}

	to := strings.TrimSpace(query.To)
	if to != "" {
		like := fmt.Sprintf("%%%s%%", to)
		qb = qb.Where("`to` LIKE ?", like)
	}

	songName := strings.TrimSpace(query.SongName)
	if songName != "" {
		like := fmt.Sprintf("%%%s%%", songName)
		qb = qb.Where("song_name LIKE ?", like)
	}

	search := strings.TrimSpace(query.Query)
	if search != "" {
		like := fmt.Sprintf("%%%s%%", search)
		qb = qb.Where("`from` LIKE ? OR `to` LIKE ? OR song_name LIKE ? OR message LIKE ?", like, like, like, like)
	}

	if query.Year > 0 {
		qb = qb.Where("YEAR(created_at) = ?", query.Year)
	}

	if query.Month >= 1 && query.Month <= 12 {
		qb = qb.Where("MONTH(created_at) = ?", query.Month)
	}

	var total int64
	if err := qb.Count(&total).Error; err != nil {
		return ListResult{}, err
	}

	var songfess []Songfess
	offset := (page - 1) * limit
	if err := qb.Order("id DESC").Limit(limit).Offset(offset).Find(&songfess).Error; err != nil {
		return ListResult{}, err
	}

	return ListResult{
		Items: songfess,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

func (r *repository) FindByID(id uint) (Songfess, error) {
	var songfess Songfess
	if err := r.db.First(&songfess, id).Error; err != nil {
		return Songfess{}, err
	}
	return songfess, nil
}

func (r *repository) FindByIDs(ids []uint) ([]Songfess, error) {
	if len(ids) == 0 {
		return []Songfess{}, nil
	}

	items := make([]Songfess, 0, len(ids))
	if err := r.db.Where("id IN ?", ids).Find(&items).Error; err != nil {
		return nil, err
	}

	return items, nil
}

func (r *repository) Create(songfess Songfess) (uint, error) {
	if err := r.db.Create(&songfess).Error; err != nil {
		return 0, err
	}
	return songfess.ID, nil
}

func (r *repository) Update(songfess Songfess) error {
	if err := r.db.Save(&songfess).Error; err != nil {
		return err
	}
	return nil
}

func (r *repository) Delete(id uint) error {
	if err := r.db.Delete(&Songfess{}, id).Error; err != nil {
		return err
	}
	return nil
}

func (r *repository) DeleteMany(ids []uint) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}

	result := r.db.Where("id IN ?", ids).Delete(&Songfess{})
	if result.Error != nil {
		return 0, result.Error
	}

	return result.RowsAffected, nil
}
