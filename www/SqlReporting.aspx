<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="SqlReporting.aspx.cs" Inherits="www.SqlReporting" meta:resourcekey="PageResource1" %>

<%@ Register Assembly="Microsoft.ReportViewer.WebForms, Version=9.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a"
    Namespace="Microsoft.Reporting.WebForms" TagPrefix="rsweb2" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
    <link href="Content/anbr/analyst.min.css" rel="stylesheet" />
</head>
<body style="padding: 0;margin: 0;">
    <form id="form1" runat="server">
    <div>
        <asp:PlaceHolder ID="PH_content" runat="server"></asp:PlaceHolder>
        <asp:ScriptManager ID="ScriptManager1" runat="server">
        </asp:ScriptManager>
        <p style="padding: 0 10px;"><asp:Label runat="server" meta:resourcekey="LabelResource1">Отчеты</asp:Label>&nbsp;<asp:DropDownList runat="server" ID="DDL_reports" AutoPostBack="True" OnSelectedIndexChanged="DDL_reports_SelectedIndexChanged" meta:resourcekey="DDL_reportsResource1" />
        <asp:Button ID="cmdHideHeader" runat="server" Text="Скрыть шапку" OnClick="cmdHideHeader_Click" meta:resourcekey="cmdHideHeaderResource1" />
        </p>
        <rsweb2:ReportViewer ID="ReportViewer2" runat="server" ProcessingMode="Remote" Width="100%" Height="2000" AsyncRendering="True"></rsweb2:ReportViewer>
        <p id="errorBlock" Visible="False" runat="server">In the process of building a reportDesc errors occurred</p>
    </div>
    </form>
</body>
</html>
