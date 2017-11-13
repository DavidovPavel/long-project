using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Web;
using System.Web.UI.WebControls;
using ANBR.Reporting.Contracts;
using Microsoft.Reporting.WebForms;
using Anbr.Web.SA.CoreLogic;
using www.SaGateway;

namespace www
{
    public partial class SqlReporting : System.Web.UI.Page
    {
        int pid;
        List<ReportOnObject> list = new List<ReportOnObject>();
        private string _lang;

        protected override void InitializeCulture()
        {
            _lang = Root.GetCurrentLang();
            if (_lang == "ru-RU")
            {
                Thread.CurrentThread.CurrentCulture = new CultureInfo("ru-RU");
                Thread.CurrentThread.CurrentUICulture = new CultureInfo("ru-RU");
            }
            else
            {
                Thread.CurrentThread.CurrentCulture = new CultureInfo("en-US");
                Thread.CurrentThread.CurrentUICulture = new CultureInfo("en-US");
            }

            base.InitializeCulture();
        }

        protected void Page_Load(object sender, EventArgs e)
        {
            if (HttpContext.Current.Session["ReportViewer2.ShowToolBar"] == null)
                HttpContext.Current.Session["ReportViewer2.ShowToolBar"] = false;

            if (!string.IsNullOrWhiteSpace(Request.QueryString["pid"]))
            {
                if (int.TryParse(Request.QueryString["pid"], out pid))
                {
                    IReportingService r = WebSaUtilities.Reporting;

                    list = r.GetReports(pid);
                    DDL_reports.DataSource = list;
                    DDL_reports.DataTextField = "ReportDescription";
                    DDL_reports.DataValueField = "ReportId";
                    if (!IsPostBack)
                    {
                        DDL_reports.DataBind();
                        DDL_reports.Items.Insert(0, new ListItem("...", "0"));

                        if (list.Count > 0)
                        {
                            if (HttpContext.Current.Session["ReportViewer2.SelectedIndex"] == null)
                                HttpContext.Current.Session["ReportViewer2.SelectedIndex"] = list.First().ReportId;

                            PrepareReport((int)HttpContext.Current.Session["ReportViewer2.SelectedIndex"]);
                        }
                        else
                            PrepareReport(null);
                    }
                }
            }

            SetPageCaptions();
        }

        protected void DDL_reports_SelectedIndexChanged(object sender, EventArgs e)
        {
            int srid = int.Parse(DDL_reports.SelectedValue);
            if (srid != 0)
            {
                HttpContext.Current.Session["ReportViewer2.SelectedIndex"] = srid;
                PrepareReport(srid);
            }
        }

        private void PrepareReport(int? srid)
        {
            if (!srid.HasValue)
                srid = (int?)HttpContext.Current.Session["ReportViewer2.SelectedIndex"];
            if (!srid.HasValue) return;

            DDL_reports.SelectedValue = srid.Value.ToString();

            ReportOnObject res = list.FirstOrDefault(el => el.ReportId == srid.Value);
            if (res != null)
            {
                string path = res.ReportPath;
                string url = res.ReportServer;
                var connect = string.IsNullOrEmpty(res.Connection) ? "" : res.Connection.Trim();
                LogBL.Write("path", path);
                LogBL.Write("url", url);
                LogBL.Write("connect", connect);
                LogBL.Write("id", pid.ToString());

                var p = new ReportParameter("id", pid.ToString());
                var pconn = new ReportParameter("ParamConnect", connect);

                try
                {
                    ReportViewer2.ServerReport.ReportServerUrl = new Uri(url);
                    ReportViewer2.ServerReport.ReportPath = path;
                    ReportViewer2.ServerReport.SetParameters(new ReportParameter[] { p, pconn });
                    errorBlock.Visible = false;
                }
                catch
                {
                    errorBlock.Visible = true;
                }
            }
        }

        protected void cmdHideHeader_Click(object sender, EventArgs e)
        {
            HttpContext.Current.Session["ReportViewer2.ShowToolBar"] = !ReportViewer2.ShowToolBar;
            SetPageCaptions();
        }

        private void SetPageCaptions()
        {
            var IsShowToolBar = (bool)HttpContext.Current.Session["ReportViewer2.ShowToolBar"];

            ReportViewer2.ShowToolBar = IsShowToolBar;
            ReportViewer2.PromptAreaCollapsed = !IsShowToolBar;


            if (IsShowToolBar) cmdHideHeader.Text = Properties.Resources.SqlReporting_HideHeader;
            else
                cmdHideHeader.Text = Properties.Resources.SqlReporting_ShowHeader;
        }
    }
}