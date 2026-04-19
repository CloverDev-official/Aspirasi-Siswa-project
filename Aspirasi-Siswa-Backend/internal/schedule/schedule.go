package schedule

import (
	"fmt"
	"slices"
	"strings"
	"sync"
	"time"
)

const (
	timezoneName = "Asia/Jakarta"
)

var (
	locationOnce sync.Once
	location     *time.Location
)

type Feature string

const (
	FeatureMenfess    Feature = "menfess"
	FeatureSongfess   Feature = "songfess"
	FeatureAspiration Feature = "aspiration"
)

type Status struct {
	Feature      string `json:"feature"`
	Label        string `json:"label"`
	IsOpen       bool   `json:"is_open"`
	Days         string `json:"days"`
	OpenAt       string `json:"open_at"`
	CloseAt      string `json:"close_at"`
	Timezone     string `json:"timezone"`
	ServerTime   string `json:"server_time"`
	NextOpenAt   string `json:"next_open_at,omitempty"`
	NextCloseAt  string `json:"next_close_at,omitempty"`
	ScheduleText string `json:"schedule_text"`
}

func getLocation() *time.Location {
	locationOnce.Do(func() {
		loc, err := time.LoadLocation(timezoneName)
		if err != nil {
			location = time.Local
			return
		}
		location = loc
	})

	return location
}

func Now() time.Time {
	return time.Now().In(getLocation())
}

func NormalizeFeature(raw string) Feature {
	value := strings.TrimSpace(strings.ToLower(raw))
	switch value {
	case "menfess":
		return FeatureMenfess
	case "songfess":
		return FeatureSongfess
	case "aspiration", "aspirasi":
		return FeatureAspiration
	default:
		return ""
	}
}

func labelForFeature(feature Feature) string {
	switch feature {
	case FeatureMenfess:
		return "Menfess"
	case FeatureSongfess:
		return "Songfess"
	case FeatureAspiration:
		return "Aspirasi"
	default:
		return "Unknown"
	}
}

func IsOpenAt(t time.Time) bool {
	return IsOpenForFeature(FeatureMenfess, t)
}

func IsOpenForFeature(feature Feature, t time.Time) bool {
	now := t.In(getLocation())
	config := GetConfigForFeature(feature)

	if !slices.Contains(config.EnabledDays, int(now.Weekday())) {
		return false
	}

	minutes := now.Hour()*60 + now.Minute()
	start, err := parseClockTime(config.OpenAt)
	if err != nil {
		return false
	}

	end, err := parseClockTime(config.CloseAt)
	if err != nil {
		return false
	}

	return minutes >= start && minutes <= end
}

func windowForDate(t time.Time, config Config) (time.Time, time.Time) {
	loc := getLocation()
	d := t.In(loc)
	openMinutes, _ := parseClockTime(config.OpenAt)
	closeMinutes, _ := parseClockTime(config.CloseAt)
	start := time.Date(d.Year(), d.Month(), d.Day(), openMinutes/60, openMinutes%60, 0, 0, loc)
	end := time.Date(d.Year(), d.Month(), d.Day(), closeMinutes/60, closeMinutes%60, 0, 0, loc)
	return start, end
}

func nextOpenAt(from time.Time) time.Time {
	return nextOpenAtForFeature(FeatureMenfess, from)
}

func nextOpenAtForFeature(feature Feature, from time.Time) time.Time {
	config := GetConfigForFeature(feature)
	now := from.In(getLocation())
	for offset := 0; offset <= 8; offset++ {
		candidate := now.AddDate(0, 0, offset)
		if !slices.Contains(config.EnabledDays, int(candidate.Weekday())) {
			continue
		}

		start, end := windowForDate(candidate, config)
		if offset == 0 {
			if now.Before(start) || now.Equal(start) {
				return start
			}
			if now.After(end) {
				continue
			}
			return start
		}

		return start
	}

	return time.Time{}
}

func nextCloseAt(from time.Time) time.Time {
	return nextCloseAtForFeature(FeatureMenfess, from)
}

func nextCloseAtForFeature(feature Feature, from time.Time) time.Time {
	if !IsOpenForFeature(feature, from) {
		return time.Time{}
	}
	config := GetConfigForFeature(feature)
	_, end := windowForDate(from, config)
	return end
}

func ScheduleText() string {
	return ScheduleTextForFeature(FeatureMenfess)
}

func ScheduleTextForFeature(feature Feature) string {
	config := GetConfigForFeature(feature)
	return fmt.Sprintf("%s %s-%s WIB", dayTextID(config.EnabledDays), config.OpenAt, config.CloseAt)
}

func ClosedDetail(feature Feature, now time.Time) string {
	next := nextOpenAtForFeature(feature, now)
	if next.IsZero() {
		return fmt.Sprintf("Pengiriman %s hanya dibuka %s", labelForFeature(feature), ScheduleTextForFeature(feature))
	}

	return fmt.Sprintf(
		"Pengiriman %s hanya dibuka %s. Buka lagi pada %s",
		labelForFeature(feature),
		ScheduleTextForFeature(feature),
		next.Format("Monday, 02 Jan 2006 15:04 WIB"),
	)
}

func StatusForFeature(feature Feature, now time.Time) Status {
	localNow := now.In(getLocation())
	config := GetConfigForFeature(feature)
	status := Status{
		Feature:      string(feature),
		Label:        labelForFeature(feature),
		IsOpen:       IsOpenForFeature(feature, localNow),
		Days:         dayTextEN(config.EnabledDays),
		OpenAt:       config.OpenAt,
		CloseAt:      config.CloseAt,
		Timezone:     timezoneName,
		ServerTime:   localNow.Format(time.RFC3339),
		ScheduleText: ScheduleTextForFeature(feature),
	}

	if status.IsOpen {
		nextClose := nextCloseAtForFeature(feature, localNow)
		if !nextClose.IsZero() {
			status.NextCloseAt = nextClose.Format(time.RFC3339)
		}
		return status
	}

	nextOpen := nextOpenAtForFeature(feature, localNow)
	if !nextOpen.IsZero() {
		status.NextOpenAt = nextOpen.Format(time.RFC3339)
	}

	return status
}

func AllStatuses(now time.Time) []Status {
	return []Status{
		StatusForFeature(FeatureMenfess, now),
		StatusForFeature(FeatureSongfess, now),
		StatusForFeature(FeatureAspiration, now),
	}
}

func dayTextEN(days []int) string {
	if len(days) == 0 {
		return "-"
	}

	names := map[int]string{
		0: "Sunday",
		1: "Monday",
		2: "Tuesday",
		3: "Wednesday",
		4: "Thursday",
		5: "Friday",
		6: "Saturday",
	}

	parts := make([]string, 0, len(days))
	for _, day := range days {
		name, ok := names[day]
		if ok {
			parts = append(parts, name)
		}
	}

	return strings.Join(parts, ",")
}

func dayTextID(days []int) string {
	if len(days) == 0 {
		return "-"
	}

	names := map[int]string{
		0: "Minggu",
		1: "Senin",
		2: "Selasa",
		3: "Rabu",
		4: "Kamis",
		5: "Jumat",
		6: "Sabtu",
	}

	parts := make([]string, 0, len(days))
	for _, day := range days {
		name, ok := names[day]
		if ok {
			parts = append(parts, name)
		}
	}

	return strings.Join(parts, ",")
}
