package aspiration

import (
	"fmt"
	"strings"

	"gorm.io/gorm"
)

type ListQuery struct {
	Page  int
	Limit int
	Name  string
	Query string
	Year  int
	Month int
}

type ListResult struct {
	Items []Aspiration
	Total int64
	Page  int
	Limit int
}

type Repository interface {
	FindAll(query ListQuery) (ListResult, error)
	FindByID(id uint) (Aspiration, error)
	FindByIDs(ids []uint) ([]Aspiration, error)
	Create(aspiration Aspiration) (uint, error)
	Update(aspiration Aspiration) error
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

	qb := r.db.Model(&Aspiration{})

	name := strings.TrimSpace(query.Name)
	if name != "" {
		like := fmt.Sprintf("%%%s%%", name)
		qb = qb.Where("name LIKE ?", like)
	}

	search := strings.TrimSpace(query.Query)
	if search != "" {
		like := fmt.Sprintf("%%%s%%", search)
		qb = qb.Where("name LIKE ? OR message LIKE ?", like, like)
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

	var aspirations []Aspiration
	offset := (page - 1) * limit
	if err := qb.Order("id DESC").Limit(limit).Offset(offset).Find(&aspirations).Error; err != nil {
		return ListResult{}, err
	}

	return ListResult{
		Items: aspirations,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

func (r *repository) FindByID(id uint) (Aspiration, error) {
	var aspiration Aspiration
	if err := r.db.First(&aspiration, id).Error; err != nil {
		return Aspiration{}, err
	}
	return aspiration, nil
}

func (r *repository) FindByIDs(ids []uint) ([]Aspiration, error) {
	if len(ids) == 0 {
		return []Aspiration{}, nil
	}

	aspirations := make([]Aspiration, 0, len(ids))
	if err := r.db.Where("id IN ?", ids).Find(&aspirations).Error; err != nil {
		return nil, err
	}

	return aspirations, nil
}

func (r *repository) Create(aspiration Aspiration) (uint, error) {
	if err := r.db.Create(&aspiration).Error; err != nil {
		return 0, err
	}
	return aspiration.ID, nil
}

func (r *repository) Update(aspiration Aspiration) error {
	if err := r.db.Save(&aspiration).Error; err != nil {
		return err
	}
	return nil
}

func (r *repository) Delete(id uint) error {
	if err := r.db.Delete(&Aspiration{}, id).Error; err != nil {
		return err
	}
	return nil
}

func (r *repository) DeleteMany(ids []uint) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}

	result := r.db.Where("id IN ?", ids).Delete(&Aspiration{})
	if result.Error != nil {
		return 0, result.Error
	}

	return result.RowsAffected, nil
}
