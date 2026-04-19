package schedule

import (
	"errors"
	"fmt"
	"maps"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"gorm.io/gorm"
)

var (
	ErrInvalidSchedule = errors.New("invalid schedule")
	ErrInvalidTarget   = errors.New("invalid schedule target")
)

type Target string

const (
	TargetShared     Target = "shared"
	TargetAspiration Target = "aspiration"
)

type ScheduleSetting struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Scope       string    `gorm:"type:varchar(32);uniqueIndex;not null" json:"scope"`
	EnabledDays string    `gorm:"type:varchar(32);not null" json:"enabled_days"`
	OpenAt      string    `gorm:"type:char(5);not null" json:"open_at"`
	CloseAt     string    `gorm:"type:char(5);not null" json:"close_at"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Config struct {
	Target      string `json:"target"`
	EnabledDays []int  `json:"enabled_days"`
	OpenAt      string `json:"open_at"`
	CloseAt     string `json:"close_at"`
	Timezone    string `json:"timezone"`
}

type UpdateConfigRequest struct {
	EnabledDays []int  `json:"enabled_days"`
	OpenAt      string `json:"open_at"`
	CloseAt     string `json:"close_at"`
}

type repository struct {
	db *gorm.DB
}

type service struct {
	repo *repository
}

var (
	moduleMu      sync.RWMutex
	moduleService *service
)

func defaultConfig() Config {
	return Config{
		Target:      string(TargetShared),
		EnabledDays: []int{0, 6},
		OpenAt:      "10:30",
		CloseAt:     "20:30",
		Timezone:    timezoneName,
	}
}

func defaultConfigForTarget(target Target) Config {
	base := defaultConfig()
	base.Target = string(target)
	return base
}

func defaultSetting(target Target) ScheduleSetting {
	cfg := defaultConfigForTarget(target)
	return ScheduleSetting{
		Scope:       string(target),
		EnabledDays: encodeEnabledDays(cfg.EnabledDays),
		OpenAt:      cfg.OpenAt,
		CloseAt:     cfg.CloseAt,
	}
}

func InitModule(db *gorm.DB) {
	moduleMu.Lock()
	defer moduleMu.Unlock()
	moduleService = &service{repo: &repository{db: db}}
}

func getService() *service {
	moduleMu.RLock()
	defer moduleMu.RUnlock()
	return moduleService
}

func NormalizeTarget(raw string) Target {
	value := strings.TrimSpace(strings.ToLower(raw))
	switch value {
	case string(TargetShared), "menfess", "songfess", "default":
		return TargetShared
	case string(TargetAspiration), "aspirasi":
		return TargetAspiration
	default:
		return ""
	}
}

func targetForFeature(feature Feature) Target {
	if feature == FeatureAspiration {
		return TargetAspiration
	}
	return TargetShared
}

func GetConfig(target Target) Config {
	target = NormalizeTarget(string(target))
	if target == "" {
		target = TargetShared
	}

	svc := getService()
	if svc == nil {
		return defaultConfigForTarget(target)
	}

	config, err := svc.getConfig(target)
	if err != nil {
		return defaultConfigForTarget(target)
	}

	return config
}

func GetConfigForFeature(feature Feature) Config {
	return GetConfig(targetForFeature(feature))
}

func GetAllConfigs() map[string]Config {
	result := map[string]Config{}
	for _, target := range []Target{TargetShared, TargetAspiration} {
		result[string(target)] = GetConfig(target)
	}
	return maps.Clone(result)
}

func UpdateConfig(target Target, request UpdateConfigRequest) (Config, error) {
	target = NormalizeTarget(string(target))
	if target == "" {
		return Config{}, fmt.Errorf("%w", ErrInvalidTarget)
	}

	svc := getService()
	if svc == nil {
		return Config{}, fmt.Errorf("schedule service is not initialized")
	}

	return svc.updateConfig(target, request)
}

func (s *service) getConfig(target Target) (Config, error) {
	setting, err := s.repo.getOrCreate(target)
	if err != nil {
		return Config{}, err
	}

	config, err := settingToConfig(setting)
	if err != nil {
		fallback := defaultConfigForTarget(target)
		if saveErr := s.repo.upsert(target, configToSetting(target, fallback)); saveErr != nil {
			return Config{}, saveErr
		}
		return fallback, nil
	}

	return config, nil
}

func (s *service) updateConfig(target Target, request UpdateConfigRequest) (Config, error) {
	config := Config{
		Target:      string(target),
		EnabledDays: request.EnabledDays,
		OpenAt:      strings.TrimSpace(request.OpenAt),
		CloseAt:     strings.TrimSpace(request.CloseAt),
		Timezone:    timezoneName,
	}

	if err := validateConfig(config); err != nil {
		return Config{}, err
	}

	if err := s.repo.upsert(target, configToSetting(target, config)); err != nil {
		return Config{}, err
	}

	return config, nil
}

func (r *repository) getOrCreate(target Target) (ScheduleSetting, error) {
	scope := string(target)
	var setting ScheduleSetting
	err := r.db.Where("scope = ?", scope).First(&setting).Error
	if err == nil {
		return setting, nil
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return ScheduleSetting{}, err
	}

	// Backward compatibility: old schema had a single row without scope.
	if target == TargetShared {
		legacyErr := r.db.Where("scope = ''").First(&setting).Error
		if legacyErr == nil {
			if updateErr := r.db.Model(&ScheduleSetting{}).Where("id = ?", setting.ID).Update("scope", scope).Error; updateErr != nil {
				return ScheduleSetting{}, updateErr
			}
			setting.Scope = scope
			return setting, nil
		}
	}

	setting = defaultSetting(target)
	if createErr := r.db.Create(&setting).Error; createErr != nil {
		return ScheduleSetting{}, createErr
	}

	return setting, nil
}

func (r *repository) upsert(target Target, setting ScheduleSetting) error {
	existing, err := r.getOrCreate(target)
	if err != nil {
		return err
	}

	updates := map[string]interface{}{
		"enabled_days": setting.EnabledDays,
		"open_at":      setting.OpenAt,
		"close_at":     setting.CloseAt,
	}

	return r.db.Model(&ScheduleSetting{}).Where("id = ?", existing.ID).Updates(updates).Error
}

func configToSetting(target Target, config Config) ScheduleSetting {
	return ScheduleSetting{
		Scope:       string(target),
		EnabledDays: encodeEnabledDays(config.EnabledDays),
		OpenAt:      config.OpenAt,
		CloseAt:     config.CloseAt,
	}
}

func settingToConfig(setting ScheduleSetting) (Config, error) {
	days, err := decodeEnabledDays(setting.EnabledDays)
	if err != nil {
		return Config{}, err
	}

	config := Config{
		Target:      setting.Scope,
		EnabledDays: days,
		OpenAt:      strings.TrimSpace(setting.OpenAt),
		CloseAt:     strings.TrimSpace(setting.CloseAt),
		Timezone:    timezoneName,
	}

	if err := validateConfig(config); err != nil {
		return Config{}, err
	}

	return config, nil
}

func validateConfig(config Config) error {
	normalizedDays := normalizeEnabledDays(config.EnabledDays)
	if len(normalizedDays) == 0 {
		return fmt.Errorf("%w: enabled_days minimal 1 hari", ErrInvalidSchedule)
	}

	if _, err := parseClockTime(config.OpenAt); err != nil {
		return fmt.Errorf("%w: open_at harus format HH:MM", ErrInvalidSchedule)
	}

	if _, err := parseClockTime(config.CloseAt); err != nil {
		return fmt.Errorf("%w: close_at harus format HH:MM", ErrInvalidSchedule)
	}

	openMinutes, _ := parseClockTime(config.OpenAt)
	closeMinutes, _ := parseClockTime(config.CloseAt)
	if closeMinutes <= openMinutes {
		return fmt.Errorf("%w: close_at harus lebih besar dari open_at", ErrInvalidSchedule)
	}

	return nil
}

func parseClockTime(value string) (int, error) {
	t, err := time.Parse("15:04", strings.TrimSpace(value))
	if err != nil {
		return 0, err
	}

	return t.Hour()*60 + t.Minute(), nil
}

func normalizeEnabledDays(days []int) []int {
	seen := make(map[int]struct{})
	result := make([]int, 0, len(days))

	for _, day := range days {
		if day < 0 || day > 6 {
			continue
		}
		if _, ok := seen[day]; ok {
			continue
		}
		seen[day] = struct{}{}
		result = append(result, day)
	}

	sort.Ints(result)
	return result
}

func encodeEnabledDays(days []int) string {
	normalized := normalizeEnabledDays(days)
	if len(normalized) == 0 {
		normalized = defaultConfig().EnabledDays
	}

	parts := make([]string, 0, len(normalized))
	for _, day := range normalized {
		parts = append(parts, strconv.Itoa(day))
	}

	return strings.Join(parts, ",")
}

func decodeEnabledDays(value string) ([]int, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil, fmt.Errorf("enabled days kosong")
	}

	parts := strings.Split(trimmed, ",")
	days := make([]int, 0, len(parts))
	for _, part := range parts {
		number, err := strconv.Atoi(strings.TrimSpace(part))
		if err != nil {
			return nil, err
		}
		days = append(days, number)
	}

	normalized := normalizeEnabledDays(days)
	if len(normalized) == 0 {
		return nil, fmt.Errorf("enabled days kosong")
	}

	return normalized, nil
}
