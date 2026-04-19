package webdriver

import (
	"bytes"
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"golang.org/x/net/html"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
	"github.com/go-rod/rod/lib/proto"
)

type WebDriverConfig struct {
	LoadTimeout  time.Duration
	PageIdleTime time.Duration
}

type WebDriver struct {
	Browser      *rod.Browser
	LoadTimeout  time.Duration
	PageIdleTime time.Duration
}

func FromDefault() *WebDriver {
	wd := &WebDriver{
		LoadTimeout:  30 * time.Second,
		PageIdleTime: 2 * time.Second,
	}
	wd.Connect()

	return wd
}

func (r *WebDriver) Connect() {
	// ✅ gunakan chromium lokal (bukan auto download)
	l := launcher.New().
		Bin("/usr/bin/chromium").
		Headless(true).
		NoSandbox(true).
		Set("disable-gpu").
		Set("no-zygote")

	url := l.MustLaunch()

	r.Browser = rod.New().
		ControlURL(url).
		MustConnect()
}

func (r *WebDriver) Close() {
	if r.Browser != nil {
		r.Browser.MustClose()
	}
}

func (r *WebDriver) IsValidHTML(binHTML []byte) bool {
	reader := bytes.NewReader(binHTML)
	_, err := html.Parse(reader)
	return err == nil
}

func (r *WebDriver) HTMLToPage(htmlBytes []byte) (*rod.Page, error) {
	if !r.IsValidHTML(htmlBytes) {
		return nil, errors.New("the provided html must be valid")
	}

	file, err := os.CreateTemp("", "*.html")
	if err != nil {
		return nil, err
	}
	defer os.Remove(file.Name())
	defer file.Close()

	if _, err = file.Write(htmlBytes); err != nil {
		return nil, err
	}

	page := r.Browser.MustPage("file://" + file.Name())

	// tunggu page load
	page.MustWaitLoad()
	time.Sleep(r.PageIdleTime)

	return page, nil
}

func ConvertHTMLToImage(elementID string, replacements map[string]string) ([]byte, error) {
	html := getHTML(replacements)

	wd := FromDefault()
	defer wd.Close()

	page, err := wd.HTMLToPage(html)
	if err != nil {
		return nil, err
	}

	el, err := page.Element("#" + elementID)
	if err != nil {
		return nil, err
	}

	if err := el.WaitVisible(); err != nil {
		return nil, err
	}

	el.MustScrollIntoView()

	buf, err := el.Screenshot(proto.PageCaptureScreenshotFormatPng, 0)
	if err != nil {
		return nil, err
	}

	return buf, nil
}

func getHTML(replacements map[string]string) []byte {
	var file string

	_, ok := replacements["CHANGE SONG"]
	if ok {
		file = filepath.Join(getBasepath(), "../../internal/storage/private/html/SONGFESS.html")
	} else {
		file = filepath.Join(getBasepath(), "../../internal/storage/private/html/MENFESS.html")
	}

	html, _ := os.ReadFile(file)

	for old, newVal := range replacements {
		html = bytes.ReplaceAll(html, []byte(old), []byte(newVal))
	}

	return html
}

func getName(name string) string {
	path := filepath.Join(getBasepath(), "../../internal/storage/private/png", name)
	return path
}

func getBasepath() string {
	_, b, _, _ := runtime.Caller(0)
	return filepath.Dir(b)
}
