<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="SqlRepPage.aspx.cs" Inherits="www.SqlRepPage" meta:resourcekey="PageResource1" %>

<%@ Register Assembly="Microsoft.ReportViewer.WebForms, Version=9.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a"
    Namespace="Microsoft.Reporting.WebForms" TagPrefix="rsweb2" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
    <link href="/Content/Site.css" rel="stylesheet" />

    <asp:PlaceHolder runat="server">
        <%: Scripts.Render("~/bundles/jquery") %>
    </asp:PlaceHolder>
</head>
<body style="padding: 0; margin: 0;">
    <form id="form1" runat="server">
        <div>
            <asp:PlaceHolder ID="PH_content" runat="server"></asp:PlaceHolder>
            <asp:ScriptManager ID="ScriptManager1" runat="server">
            </asp:ScriptManager>
            <asp:Button Style="position: absolute;left:255px;" ID="cmdHideHeader" runat="server" Text="Скрыть шапку" OnClick="cmdHideHeader_Click" meta:resourcekey="cmdHideHeaderResource1" />
             <rsweb2:ReportViewer ID="ReportViewer2" runat="server" ProcessingMode="Remote" Width="100%" Height="2000" AsyncRendering="True"></rsweb2:ReportViewer>
            <p id="errorBlock" visible="False" runat="server">In the process of building a reportDesc errors occurred</p>
        </div>
    </form>
    <script>
    </script>
</body>
</html>
