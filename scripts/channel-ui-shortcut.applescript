property appUrl : "http://localhost:43173/"
property healthUrl : "http://localhost:43173/__channel_health"
property htmlPath : ""
property projectDir : ""

on run
    if htmlPath is "" then
        set htmlPath to POSIX path of (path to home folder) & "Documents/GitHub/Channel/apps/channel-web/index.html"
    end if
    if projectDir is "" then
        set projectDir to POSIX path of (path to home folder) & "Documents/GitHub/Channel"
    end if

    try
        set serverReachable to my isChannelServerReachable()

        if not serverReachable then
            do shell script "/bin/zsh -lc " & quoted form of ("cd " & quoted form of projectDir & " && nohup npm run dev:web >/tmp/channel-ui.log 2>&1 &")
            set serverReachable to my waitForChannelServer()
        end if

        if serverReachable then
            do shell script "/usr/bin/open " & quoted form of appUrl
            return
        end if

        do shell script "/usr/bin/open " & quoted form of htmlPath
    on error errMsg number errNum
        display dialog "无法打开 Channel UI：" & return & errMsg & " (" & errNum & ")" buttons {"好"} default button 1 with icon stop
    end try
end run

on isChannelServerReachable()
    try
        set statusCode to do shell script "/usr/bin/curl -s -o /dev/null -w '%{http_code}' --max-time 1 " & quoted form of healthUrl
        return statusCode is "200"
    on error
        return false
    end try
end isChannelServerReachable

on waitForChannelServer()
    repeat 20 times
        if my isChannelServerReachable() then
            return true
        end if
        delay 0.5
    end repeat
    return false
end waitForChannelServer
