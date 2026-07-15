// =============================================================================
// Bloatware app catalog — curated from OZBoost's Apps.json
// =============================================================================
// Each app has a recommendation level:
//   'safe'     — bloat, can be removed without consequence
//   'optional' — user decision (might be useful: Calculator, Photos, etc.)
//   'unsafe'   — don't remove unless you know what you're doing (breaks features)
//
// `desc`: one-line plain-German explanation ("für Dummies") shown in the UI.
// `method`: 'appx' uses Remove-AppxPackage; 'winget' uses winget uninstall --id

export const APP_GROUPS = [
  { id: 'microsoft',  label: 'Microsoft Bloatware',   icon: 'package' },
  { id: 'thirdparty', label: 'Drittanbieter / OEM',   icon: 'package' },
  { id: 'oem_hp',     label: 'HP',                    icon: 'display' },
  { id: 'oem_dell',   label: 'Dell',                  icon: 'display' },
  { id: 'oem_lenovo', label: 'Lenovo',                icon: 'display' },
  { id: 'oem_lg',     label: 'LG',                    icon: 'display' },
  { id: 'games',      label: 'Vorinstallierte Spiele', icon: 'gamepad' },
]

const GAME_DESC = 'Vorinstalliertes Gratis-Spiel mit Werbung und In-App-Käufen. Kann weg.'
const OEM_DESC = 'Hersteller-Zusatzsoftware (vorinstalliert). Meist überflüssig.'

export const APPS = [
  // ─── Microsoft Bloatware (safe) ───
  { id: 'Clipchamp.Clipchamp', name: 'Clipchamp', group: 'microsoft', rec: 'safe', desc: 'Microsofts Video-Editor. Nur nötig, wenn du damit Videos schneidest.' },
  { id: 'Microsoft.549981C3F5F10', name: 'Cortana', group: 'microsoft', rec: 'safe', desc: 'Alter Sprachassistent — von Microsoft eingestellt. Kann weg.' },
  { id: 'Microsoft.BingNews', name: 'Bing News', group: 'microsoft', rec: 'safe', desc: 'Nachrichten-App mit Werbung. Kann weg.' },
  { id: 'Microsoft.BingWeather', name: 'Bing Weather', group: 'microsoft', rec: 'safe', desc: 'Wetter-App. Wetter gibts auch im Browser.' },
  { id: 'Microsoft.BingSports', name: 'Bing Sports', group: 'microsoft', rec: 'safe', desc: 'Sport-News-App. Kann weg.' },
  { id: 'Microsoft.BingFinance', name: 'Bing Finance', group: 'microsoft', rec: 'safe', desc: 'Börsen-News-App. Kann weg.' },
  { id: 'Microsoft.Getstarted', name: 'Get Started', group: 'microsoft', rec: 'safe', desc: 'Windows-Einführungs-Tipps. Einmal gesehen, nie wieder gebraucht.' },
  { id: 'Microsoft.Microsoft3DViewer', name: '3D Viewer', group: 'microsoft', rec: 'safe', desc: 'Zeigt 3D-Modelle an. Braucht fast niemand.' },
  { id: 'Microsoft.MicrosoftOfficeHub', name: 'Office Hub', group: 'microsoft', rec: 'safe', desc: 'Werbe-App für das Microsoft-365-Abo. Kann weg.' },
  { id: 'Microsoft.MicrosoftSolitaireCollection', name: 'Solitaire', group: 'microsoft', rec: 'safe', desc: 'Kartenspiel mit Werbung. Kann weg.' },
  { id: 'Microsoft.MicrosoftStickyNotes', name: 'Sticky Notes', group: 'microsoft', rec: 'safe', desc: 'Digitale Haftnotizen auf dem Desktop. Weg, wenn du sie nicht nutzt.' },
  { id: 'Microsoft.MixedReality.Portal', name: 'Mixed Reality Portal', group: 'microsoft', rec: 'safe', desc: 'Für Windows-VR-Headsets. Ohne Headset nutzlos.' },
  { id: 'Microsoft.NetworkSpeedTest', name: 'Network Speed Test', group: 'microsoft', rec: 'safe', desc: 'Internet-Geschwindigkeitstest. Geht auch im Browser.' },
  { id: 'Microsoft.News', name: 'News', group: 'microsoft', rec: 'safe', desc: 'Microsoft-News-Feed mit Werbung. Kann weg.' },
  { id: 'Microsoft.Office.OneNote', name: 'OneNote (UWP)', group: 'microsoft', rec: 'safe', desc: 'Alte Version der Notiz-App. Die aktuelle kommt mit Office.' },
  { id: 'Microsoft.Office.Sway', name: 'Sway', group: 'microsoft', rec: 'safe', desc: 'Präsentations-Tool, das kaum jemand nutzt. Kann weg.' },
  { id: 'Microsoft.OneConnect', name: 'Paid Wi-Fi & Cellular', group: 'microsoft', rec: 'safe', desc: 'Verkauft WLAN-/Mobilfunk-Tarife. Nutzlos.' },
  { id: 'Microsoft.Print3D', name: 'Print 3D', group: 'microsoft', rec: 'safe', desc: '3D-Druck-App. Ohne 3D-Drucker nutzlos.' },
  { id: 'Microsoft.SkypeApp', name: 'Skype', group: 'microsoft', rec: 'safe', desc: 'Veralteter Messenger, durch Teams ersetzt. Kann weg.' },
  { id: 'Microsoft.Todos', name: 'Microsoft To Do', group: 'microsoft', rec: 'safe', desc: 'Aufgabenlisten-App. Weg, wenn du sie nicht nutzt.' },
  { id: 'Microsoft.Windows.DevHome', name: 'Dev Home', group: 'microsoft', rec: 'safe', desc: 'Dashboard für Programmierer. Für alle anderen nutzlos.' },
  { id: 'Microsoft.WindowsAlarms', name: 'Alarms & Clock', group: 'microsoft', rec: 'safe', desc: 'Wecker & Timer am PC. Weg, wenn du das nicht nutzt.' },
  { id: 'Microsoft.WindowsFeedbackHub', name: 'Feedback Hub', group: 'microsoft', rec: 'safe', desc: 'Schickt Feedback und Nutzungsdaten an Microsoft. Kann weg.' },
  { id: 'Microsoft.WindowsMaps', name: 'Maps', group: 'microsoft', rec: 'safe', desc: 'Karten-App. Google Maps im Browser kann mehr.' },
  { id: 'Microsoft.WindowsSoundRecorder', name: 'Voice Recorder', group: 'microsoft', rec: 'safe', desc: 'Sprachmemos aufnehmen. Selten gebraucht.' },
  { id: 'Microsoft.XboxApp', name: 'Xbox Console Companion (alt)', group: 'microsoft', rec: 'safe', desc: 'Alte Xbox-App, längst ersetzt. Kann weg.' },
  { id: 'Microsoft.ZuneVideo', name: 'Movies & TV', group: 'microsoft', rec: 'safe', desc: 'Video-Player + Filmverleih von Microsoft. VLC kann mehr.' },
  { id: 'MicrosoftCorporationII.MicrosoftFamily', name: 'Family Safety', group: 'microsoft', rec: 'safe', desc: 'Kindersicherung. Ohne Kinder-Konten nutzlos.' },
  { id: 'MicrosoftCorporationII.QuickAssist', name: 'Quick Assist', group: 'microsoft', rec: 'safe', desc: 'Fernhilfe — jemand steuert deinen PC übers Internet. Weg, wenn nie genutzt.' },
  { id: 'MicrosoftTeams', name: 'Microsoft Teams (alt)', group: 'microsoft', rec: 'safe', desc: 'Alte Teams-Version. Kann weg.' },
  { id: 'MSTeams', name: 'Microsoft Teams (neu)', group: 'microsoft', rec: 'safe', desc: 'Meeting-/Chat-App. Weg, wenn du nicht damit arbeitest.' },
  { id: 'Microsoft.3DBuilder', name: '3D Builder', group: 'microsoft', rec: 'safe', desc: '3D-Modelle bauen. Braucht fast niemand.' },
  { id: 'Microsoft.MicrosoftJournal', name: 'Journal', group: 'microsoft', rec: 'safe', desc: 'Notizen mit Stift (für Tablets). Ohne Stift nutzlos.' },
  { id: 'Microsoft.MicrosoftPowerBIForWindows', name: 'Power BI', group: 'microsoft', rec: 'safe', desc: 'Business-Statistik-Tool für Firmen. Privat nutzlos.' },
  { id: 'Microsoft.PowerAutomateDesktop', name: 'Power Automate Desktop', group: 'microsoft', rec: 'safe', desc: 'Automatisiert Büro-Abläufe. Braucht privat kaum jemand.' },
  { id: 'Microsoft.PCManager', name: 'PC Manager', group: 'microsoft', rec: 'safe', desc: 'Microsofts eigenes Aufräum-Tool. Überflüssig.' },
  { id: 'Microsoft.Windows.AIHub', name: 'AI Hub (Copilot+)', group: 'microsoft', rec: 'safe', desc: 'Werbe-App für KI-Features. Kann weg.' },

  // ─── Optional (user decision) ───
  { id: 'Microsoft.BingSearch', name: 'Bing Search', group: 'microsoft', rec: 'optional', desc: 'Bing-Websuche im Startmenü. Weg = weniger Werbung beim Suchen.' },
  { id: 'Microsoft.GamingApp', name: 'Xbox App', group: 'microsoft', rec: 'optional', desc: 'Nötig für Xbox Game Pass! Nur entfernen, wenn du keinen Game Pass nutzt.' },
  { id: 'Microsoft.MSPaint', name: 'Paint 3D', group: 'microsoft', rec: 'optional', desc: 'Malprogramm in 3D. Das normale Paint reicht meist.' },
  { id: 'Microsoft.Paint', name: 'Paint', group: 'microsoft', rec: 'optional', desc: 'Das klassische Malprogramm. Viele nutzen es doch — überlegen.' },
  { id: 'Microsoft.OneDrive', name: 'OneDrive', group: 'microsoft', rec: 'optional', desc: 'Microsoft-Cloud-Speicher. Weg = deine Dateien werden nicht mehr synchronisiert.' },
  { id: 'Microsoft.OutlookForWindows', name: 'Outlook (neu)', group: 'microsoft', rec: 'optional', desc: 'E-Mail-Programm. Weg, wenn du Mails im Browser liest.' },
  { id: 'Microsoft.RemoteDesktop', name: 'Remote Desktop', group: 'microsoft', rec: 'optional', desc: 'Anderen PC fernsteuern. Nur für Fortgeschrittene relevant.' },
  { id: 'Microsoft.ScreenSketch', name: 'Snipping Tool', group: 'microsoft', rec: 'optional', desc: 'Screenshots machen! Viele nutzen es täglich — eher behalten.' },
  { id: 'Microsoft.StartExperiencesApp', name: 'Start Experience (Widgets)', group: 'microsoft', rec: 'optional', desc: 'Widgets im Startmenü. Weg = weniger Ablenkung.' },
  { id: 'Microsoft.Whiteboard', name: 'Whiteboard', group: 'microsoft', rec: 'optional', desc: 'Digitales Whiteboard für Meetings. Privat selten genutzt.' },
  { id: 'Microsoft.Windows.Photos', name: 'Photos', group: 'microsoft', rec: 'optional', desc: 'Standard-Bildanzeige! Weg = du brauchst Ersatz zum Bilder öffnen.' },
  { id: 'Microsoft.WindowsCalculator', name: 'Calculator', group: 'microsoft', rec: 'optional', desc: 'Der Taschenrechner. Nutzt fast jeder — eher behalten.' },
  { id: 'Microsoft.WindowsCamera', name: 'Camera', group: 'microsoft', rec: 'optional', desc: 'Webcam-App. Weg, wenn du die Kamera nie nutzt.' },
  { id: 'Microsoft.WindowsNotepad', name: 'Notepad', group: 'microsoft', rec: 'optional', desc: 'Der Editor für Textdateien. Eher behalten.' },
  { id: 'Microsoft.YourPhone', name: 'Phone Link', group: 'microsoft', rec: 'optional', desc: 'Verbindet dein Handy mit dem PC (SMS, Fotos, Anrufe). Für manche praktisch.' },
  { id: 'Microsoft.ZuneMusic', name: 'Media Player', group: 'microsoft', rec: 'optional', desc: 'Musik-/Video-Player. Weg, wenn du Spotify oder VLC nutzt.' },
  { id: 'MicrosoftWindows.CrossDevice', name: 'Cross Device', group: 'microsoft', rec: 'optional', desc: 'Handy-PC-Verbindung im Hintergrund. Gehört zu Phone Link.' },
  { id: 'MicrosoftWindows.Client.WebExperience', name: 'Web Experience (Widgets)', group: 'microsoft', rec: 'optional', desc: 'Das Widget-Board (Wetter/News in der Taskleiste). Weg = Widgets weg.' },
  { id: 'Microsoft.WidgetsPlatformRuntime', name: 'Widgets Platform Runtime', group: 'microsoft', rec: 'optional', desc: 'Technik hinter den Widgets. Weg = Widgets funktionieren nicht mehr.' },
  { id: 'Microsoft.People', name: 'People', group: 'microsoft', rec: 'optional', desc: 'Kontakte-App. Kaum genutzt.' },
  { id: 'Microsoft.windowscommunicationsapps', name: 'Mail & Calendar', group: 'microsoft', rec: 'optional', desc: 'Alte Mail-/Kalender-App. Weg, wenn du Outlook oder den Browser nutzt.' },

  // ─── Unsafe (breaks things) ───
  { id: 'Microsoft.Edge', name: 'Microsoft Edge', group: 'microsoft', rec: 'unsafe', method: 'winget', wingetId: 'XPFFTQ037JWMHS', desc: 'Microsofts Browser. Manche Apps brauchen ihn; Windows-Update holt ihn oft zurück.' },
  { id: 'Microsoft.GetHelp', name: 'Get Help (Troubleshooter)', group: 'microsoft', rec: 'unsafe', desc: 'Windows-Problembehandlung. Weg = eingebaute Hilfe-Funktionen fehlen.' },
  { id: 'Microsoft.WindowsStore', name: 'Microsoft Store', group: 'microsoft', rec: 'unsafe', desc: 'Der App-Store. Weg = keine App-Installationen und -Updates mehr! Nicht empfohlen.' },
  { id: 'Microsoft.WindowsTerminal', name: 'Windows Terminal', group: 'microsoft', rec: 'unsafe', desc: 'Kommandozeilen-Fenster. System-Tools brauchen es teilweise.' },
  { id: 'Microsoft.Xbox.TCUI', name: 'Xbox TCUI', group: 'microsoft', rec: 'unsafe', desc: 'Xbox-Technik für Freundeslisten/Chat in Spielen. Weg = Login-Probleme in manchen Games.' },
  { id: 'Microsoft.XboxIdentityProvider', name: 'Xbox Identity Provider', group: 'microsoft', rec: 'unsafe', desc: 'Xbox-Anmeldung. Weg = Microsoft-Spiele (Minecraft etc.) starten nicht mehr!' },
  { id: 'Microsoft.XboxSpeechToTextOverlay', name: 'Xbox Speech-to-Text', group: 'microsoft', rec: 'unsafe', desc: 'Xbox Sprache-zu-Text-Funktion. Nur weg, wenn nie genutzt.' },

  // ─── Drittanbieter Bloat ───
  { id: 'AdobeSystemsIncorporated.AdobePhotoshopExpress', name: 'Photoshop Express', group: 'thirdparty', rec: 'safe', desc: 'Abgespeckter Foto-Editor mit Abo-Werbung. Kann weg.' },
  { id: 'Amazon.com.Amazon', name: 'Amazon', group: 'thirdparty', rec: 'safe', desc: 'Amazon-Shopping-Verknüpfung. Geht auch im Browser.' },
  { id: 'AmazonVideo.PrimeVideo', name: 'Prime Video', group: 'thirdparty', rec: 'safe', desc: 'Streaming-App. Geht auch im Browser.' },
  { id: 'Disney.37853FC22B2CE', name: 'Disney+', group: 'thirdparty', rec: 'safe', desc: 'Streaming-App. Geht auch im Browser.' },
  { id: '4DF9E0F8.Netflix', name: 'Netflix', group: 'thirdparty', rec: 'safe', desc: 'Streaming-App. Geht auch im Browser.' },
  { id: 'HULULLC.HULUPLUS', name: 'Hulu', group: 'thirdparty', rec: 'safe', desc: 'US-Streaming-Dienst. In Deutschland nutzlos.' },
  { id: 'SpotifyAB.SpotifyMusic', name: 'Spotify', group: 'thirdparty', rec: 'safe', desc: 'Musik-App. Wenn du Spotify nutzt: Haken wegnehmen und behalten!' },
  { id: 'BytedancePte.Ltd.TikTok', name: 'TikTok', group: 'thirdparty', rec: 'safe', desc: 'Social-Media-App. Geht auch im Browser.' },
  { id: 'FACEBOOK.FACEBOOK', name: 'Facebook', group: 'thirdparty', rec: 'safe', desc: 'Social-Media-App. Geht auch im Browser.' },
  { id: 'Facebook.Instagram', name: 'Instagram', group: 'thirdparty', rec: 'safe', desc: 'Social-Media-App. Geht auch im Browser.' },
  { id: 'Flipgrid.Flipgrid', name: 'Flipgrid', group: 'thirdparty', rec: 'safe', desc: 'Video-Lern-App für Schulen. Kann weg.' },
  { id: 'Flipboard.Flipboard', name: 'Flipboard', group: 'thirdparty', rec: 'safe', desc: 'News-Sammel-App. Kann weg.' },
  { id: 'Twitter.Twitter', name: 'Twitter', group: 'thirdparty', rec: 'safe', desc: 'Social-Media-App. Geht auch im Browser.' },
  { id: 'TuneIn.TuneInRadio', name: 'TuneIn Radio', group: 'thirdparty', rec: 'safe', desc: 'Internet-Radio-App. Kann weg.' },
  { id: 'DrawboardPDF.DrawboardPDF', name: 'Drawboard PDF', group: 'thirdparty', rec: 'safe', desc: 'PDF-Notizen-App mit Abo. Kann weg.' },
  { id: 'Duolingo-LearnLanguagesforFree', name: 'Duolingo', group: 'thirdparty', rec: 'safe', desc: 'Sprachlern-App. Weg, wenn nicht genutzt.' },
  { id: 'CyberLinkMediaSuiteEssentials', name: 'CyberLink Media Suite', group: 'thirdparty', rec: 'safe', desc: 'Vorinstallierte Videosoftware-Testversion. Kann weg.' },
  { id: 'WinZipComputing.WinZip', name: 'WinZip Universal', group: 'thirdparty', rec: 'safe', desc: 'Kostenpflichtiger Entpacker. Windows entpackt ZIP-Dateien selbst.' },
  { id: 'EclipseManager', name: 'Eclipse Manager', group: 'thirdparty', rec: 'safe', desc: 'Aufgaben-App. Kann weg.' },
  { id: 'PicsArt-PhotoStudio', name: 'PicsArt', group: 'thirdparty', rec: 'safe', desc: 'Foto-Editor mit Abo-Werbung. Kann weg.' },

  // ─── Vorinstallierte Spiele ───
  { id: 'king.com.BubbleWitch3Saga', name: 'Bubble Witch 3 Saga', group: 'games', rec: 'safe', desc: GAME_DESC },
  { id: 'king.com.CandyCrushSaga', name: 'Candy Crush Saga', group: 'games', rec: 'safe', desc: GAME_DESC },
  { id: 'king.com.CandyCrushSodaSaga', name: 'Candy Crush Soda Saga', group: 'games', rec: 'safe', desc: GAME_DESC },
  { id: 'Asphalt8Airborne', name: 'Asphalt 8', group: 'games', rec: 'safe', desc: GAME_DESC },
  { id: 'DisneyMagicKingdoms', name: 'Disney Magic Kingdoms', group: 'games', rec: 'safe', desc: GAME_DESC },
  { id: 'MarchofEmpires', name: 'March of Empires', group: 'games', rec: 'safe', desc: GAME_DESC },
  { id: 'COOKINGFEVER', name: 'Cooking Fever', group: 'games', rec: 'safe', desc: GAME_DESC },
  { id: 'FarmVille2CountryEscape', name: 'FarmVille 2', group: 'games', rec: 'safe', desc: GAME_DESC },
  { id: 'HiddenCity', name: 'Hidden City', group: 'games', rec: 'safe', desc: GAME_DESC },
  { id: 'CaesarsSlotsFreeCasino', name: 'Caesars Slots', group: 'games', rec: 'safe', desc: GAME_DESC },

  // ─── HP OEM ───
  { id: 'AD2F1837.HPMyDisplay', name: 'HP My Display', group: 'oem_hp', rec: 'safe', desc: OEM_DESC },
  { id: 'AD2F1837.HPAIExperienceCenter', name: 'HP AI Experience Center', group: 'oem_hp', rec: 'safe', desc: OEM_DESC },
  { id: 'AD2F1837.HPConnectedMusic', name: 'HP Connected Music', group: 'oem_hp', rec: 'safe', desc: OEM_DESC },
  { id: 'AD2F1837.HPConnectedPhotopoweredbySnapfish', name: 'HP Connected Photo', group: 'oem_hp', rec: 'safe', desc: OEM_DESC },
  { id: 'AD2F1837.HPDesktopSupportUtilities', name: 'HP Desktop Support Utilities', group: 'oem_hp', rec: 'safe', desc: OEM_DESC },
  { id: 'AD2F1837.HPEasyClean', name: 'HP Easy Clean', group: 'oem_hp', rec: 'safe', desc: OEM_DESC },
  { id: 'AD2F1837.HPFileViewer', name: 'HP File Viewer', group: 'oem_hp', rec: 'safe', desc: OEM_DESC },
  { id: 'AD2F1837.HPJumpStarts', name: 'HP JumpStarts', group: 'oem_hp', rec: 'safe', desc: OEM_DESC },
  { id: 'AD2F1837.HPPCHardwareDiagnosticsWindows', name: 'HP PC Hardware Diagnostics', group: 'oem_hp', rec: 'safe', desc: 'HP-Hardware-Test-Tool. Nur auf HP-Geräten sinnvoll, dort selten gebraucht.' },
  { id: 'AD2F1837.HPPowerManager', name: 'HP Power Manager', group: 'oem_hp', rec: 'safe', desc: OEM_DESC },
  { id: 'AD2F1837.HPPrinterControl', name: 'HP Printer Control', group: 'oem_hp', rec: 'safe', desc: 'HP-Drucker-Verwaltung. Weg, wenn du keinen HP-Drucker hast.' },
  { id: 'AD2F1837.HPPrivacySettings', name: 'HP Privacy Settings', group: 'oem_hp', rec: 'safe', desc: OEM_DESC },
  { id: 'AD2F1837.HPQuickDrop', name: 'HP Quick Drop', group: 'oem_hp', rec: 'safe', desc: 'Dateien zwischen Handy und HP-PC teilen. Meist ungenutzt.' },
  { id: 'AD2F1837.HPRegistration', name: 'HP Registration', group: 'oem_hp', rec: 'safe', desc: 'Produkt-Registrierungs-Werbung. Kann weg.' },
  { id: 'AD2F1837.HPSupportAssistant', name: 'HP Support Assistant', group: 'oem_hp', rec: 'safe', desc: 'HP-Support/Treiber-Tool. Kann für Treiber-Updates nützlich sein.' },
  { id: 'AD2F1837.HPSystemInformation', name: 'HP System Information', group: 'oem_hp', rec: 'safe', desc: OEM_DESC },
  { id: 'AD2F1837.HPWelcome', name: 'HP Welcome', group: 'oem_hp', rec: 'safe', desc: 'HP-Begrüßungs-App. Kann weg.' },
  { id: 'AD2F1837.myHP', name: 'myHP', group: 'oem_hp', rec: 'safe', desc: OEM_DESC },

  // ─── Dell OEM ───
  { id: 'DellInc.DellSupportAssistforPCs', name: 'Dell SupportAssist', group: 'oem_dell', rec: 'safe', desc: 'Dell-Support/Treiber-Tool. Kann für Treiber-Updates nützlich sein.' },
  { id: 'DellInc.DellDigitalDelivery', name: 'Dell Digital Delivery', group: 'oem_dell', rec: 'safe', desc: 'Installiert vorbestellte Dell-Software. Nach Einrichtung überflüssig.' },
  { id: 'DellInc.DellMobileConnect', name: 'Dell Mobile Connect', group: 'oem_dell', rec: 'safe', desc: 'Handy-PC-Verbindung von Dell. Phone Link kann dasselbe.' },

  // ─── Lenovo OEM ───
  { id: 'E046963F.LenovoCompanion', name: 'Lenovo Vantage', group: 'oem_lenovo', rec: 'safe', desc: 'Lenovo-Einstellungs/Treiber-Tool. Kann für Updates nützlich sein.' },
  { id: 'LenovoCompanyLimited.LenovoVantageService', name: 'Lenovo Vantage Service', group: 'oem_lenovo', rec: 'safe', desc: 'Hintergrund-Dienst für Lenovo Vantage. Gehört zu Vantage.' },

  // ─── LG OEM ───
  { id: 'LGElectronics.LGMonitorApp', name: 'LG Monitor App', group: 'oem_lg', rec: 'safe', desc: 'LG-Monitor-Einstellungen. Weg, wenn du keinen LG-Monitor hast.' },
]

// Convenience: filter apps by recommendation level.
export const SAFE_APPS = APPS.filter((a) => a.rec === 'safe')
export const OPTIONAL_APPS = APPS.filter((a) => a.rec === 'optional')
export const UNSAFE_APPS = APPS.filter((a) => a.rec === 'unsafe')
