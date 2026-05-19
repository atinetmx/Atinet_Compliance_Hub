' Script VBS para insertar marcador en Word - SILENCIOSO
' Uso: wscript insertar-marcador.vbs "{{c_alias_COMPRADOR_1}}"

Set objArgs = WScript.Arguments
If objArgs.Count = 0 Then
    WScript.Quit
End If

marcador = objArgs(0)

' Remover protocolo si viene incluido
marcador = Replace(marcador, "marcador://", "")
' URL Decode
marcador = Replace(marcador, "%7B%7B", "{{")
marcador = Replace(marcador, "%7D%7D", "}}")
marcador = Replace(marcador, "%5F", "_")
marcador = Replace(marcador, "/", "")  ' Remover trailing slash

On Error Resume Next

' Crear objeto shell para logs
Set objShell = CreateObject("WScript.Shell")
logPath = objShell.ExpandEnvironmentStrings("%TEMP%") & "\marcador-replace.log"

' Intentar conectar con Word abierto
Set wordApp = GetObject(, "Word.Application")

If Err.Number = 0 And Not (wordApp Is Nothing) Then
    ' Word está abierto
    Err.Clear
    Set selection = wordApp.Selection

    ' Reemplazar texto seleccionado + agregar espacio
    selection.Text = marcador & " "
    wordApp.Activate

    ' Log silencioso
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set logFile = fso.OpenTextFile(logPath, 8, True)
    logFile.WriteLine Now & " - Marcador insertado: " & marcador & " "
    logFile.Close
Else
    ' Word no está abierto, copiar al clipboard
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set logFile = fso.OpenTextFile(logPath, 8, True)
    logFile.WriteLine Now & " - Copiado al clipboard: " & marcador & " "
    logFile.Close

    ' Copiar al clipboard mediante PowerShell (con espacio al final)
    Set objExec = objShell.Exec("powershell -NoProfile -Command """ & marcador & " " & """ | Set-Clipboard")
End If

' Salir silenciosamente
WScript.Quit


