#Include "Protheus.ch"

/*
  MFA001LIB - REST client for mfaserver
  Endpoints: /enrol, /confirm, /validate, /delete, /health
*/

Static Function MfaUrl()
  Local cUrl := SuperGetMV("MV_MFA_URL", .F., "")
Return cUrl

Static Function MfaKey()
  Local cKey := SuperGetMV("MV_MFA_KEY", .F., "")
Return cKey

User Function MfaEnabled()
  Local lEnabled := SuperGetMV("MV_MFA_EN", .F., .F.)
Return lEnabled

User Function MfaHealth()
  Local oRest := FWRest():New(MfaUrl())
  Local cResp := ""
  Local lOk := .F.

  oRest:SetPath("/health")

  If oRest:Get()
    cResp := oRest:GetResult()
    lOk := 'ok' $ cResp
  EndIf

  FreeObj(oRest)
Return lOk

User Function MfaEnrol(cUserId)
  Local oRest := FWRest():New(MfaUrl())
  Local cBody := '{"user_id":"' + AllTrim(cUserId) + '"}'
  Local cResp := ""
  Local aRet := {}

  oRest:SetPath("/enrol")
  oRest:SetPostParams(cBody)
  oRest:AddHeader("Content-Type", "application/json")
  oRest:AddHeader("x-api-key", MfaKey())

  If oRest:Post()
    cResp := oRest:GetResult()
    aRet := {.T., cResp}
  Else
    aRet := {.F., oRest:GetResult()}
  EndIf

  FreeObj(oRest)
Return aRet

User Function MfaConfirm(cUserId, cToken)
  Local oRest := FWRest():New(MfaUrl())
  Local cBody := '{"user_id":"' + AllTrim(cUserId) + '","token":"' + AllTrim(cToken) + '"}'
  Local cResp := ""
  Local lOk := .F.

  oRest:SetPath("/confirm")
  oRest:SetPostParams(cBody)
  oRest:AddHeader("Content-Type", "application/json")
  oRest:AddHeader("x-api-key", MfaKey())

  If oRest:Post()
    cResp := oRest:GetResult()
    lOk := 'ACTIVE' $ cResp
  EndIf

  FreeObj(oRest)
Return lOk

User Function MfaValidate(cUserId, cToken)
  Local oRest := FWRest():New(MfaUrl())
  Local cBody := '{"user_id":"' + AllTrim(cUserId) + '","token":"' + AllTrim(cToken) + '"}'
  Local cResp := ""
  Local lOk := .F.

  oRest:SetPath("/validate")
  oRest:SetPostParams(cBody)
  oRest:AddHeader("Content-Type", "application/json")
  oRest:AddHeader("x-api-key", MfaKey())

  If oRest:Post()
    cResp := oRest:GetResult()
    lOk := '"valid":true' $ Lower(cResp)
  EndIf

  FreeObj(oRest)
Return lOk
