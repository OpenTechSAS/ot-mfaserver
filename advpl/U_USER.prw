#Include "Protheus.ch"

/*
  U_USER - Hook post-login MFA
  Punto de entrada PtInternal: se ejecuta despues de validar RA_SENHA
  y antes de entregar la sesion al usuario.
*/

User Function U_USER()
  Local cUser  := cUserName
  Local cAdmin := SuperGetMV("MV_MFA_ADM", .F., "admin")
  Local cToken := ""
  Local lValid := .F.
  Local nTries := 0
  Local nMaxTries := 3

  If !U_MfaEnabled()
    Return
  EndIf

  If Upper(AllTrim(cUser)) == Upper(AllTrim(cAdmin))
    Return
  EndIf

  While nTries < nMaxTries .And. !lValid
    nTries++
    cToken := Space(6)

    DEFINE MSDIALOG oDlg TITLE "Desafio MFA - Segundo Factor" FROM 0,0 TO 150,400 PIXEL
      @ 15, 10 SAY "Ingrese el codigo de 6 digitos de Google Authenticator:" SIZE 180, 10 PIXEL OF oDlg
      @ 35, 60 MSGET oGet VAR cToken SIZE 80, 12 PIXEL OF oDlg PICTURE "999999"
      @ 60, 60 BUTTON oBtnOk PROMPT "Validar" SIZE 40, 14 PIXEL OF oDlg ACTION (oDlg:End())
      @ 60,110 BUTTON oBtnCn PROMPT "Cancelar" SIZE 40, 14 PIXEL OF oDlg ACTION (cToken := "", oDlg:End())
    ACTIVATE MSDIALOG oDlg CENTERED

    If Empty(AllTrim(cToken))
      MsgAlert("Acceso denegado. Se requiere autenticacion MFA.", "MFA")
      __Quit()
      Return
    EndIf

    lValid := U_MfaValidate(AllTrim(cUser), AllTrim(cToken))

    If !lValid
      If nTries < nMaxTries
        MsgAlert("Codigo invalido. Intento " + cValToChar(nTries) + " de " + cValToChar(nMaxTries), "MFA")
      Else
        MsgAlert("Maximo de intentos alcanzado. Acceso denegado.", "MFA")
        __Quit()
        Return
      EndIf
    EndIf
  EndDo
Return
