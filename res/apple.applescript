on run
    tell application "Finder"
        set theItem to selection as string
    end tell
    set posixForm to POSIX path of theItem
    -- set the clipboard to posixForm
    return posixForm
end run