using System.Drawing;
using ANBR.SemanticArchive.SDK.Queries;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Mail;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Threading;
using System.Web;
using System.Web.Hosting;
using ABS.WReportsProcessing.Contracts;
using Anbr.Web.SA.CoreLogic;
using ANBR.Common;
using ANBR.Common.Filters;
using ANBR.Query.Common;
using ANBR.SemanticArchive.SDK;
using www.Models;
using www.SaGateway;
using ANBR.SemanticArchive.SDK.Queries2;
using ANBR.Web.ExternalCore.Contract;
using www.Models.Data.In;
using www.Models.Items;
using TypeObjectListView = ANBR.Common.Filters.TypeObjectListView;

namespace www
{
    public static class Root
    {
        public static class VersionData
        {
            public static string Server { get; set; }
            public static string Client { get; set; }

            static VersionData()
            {
                Server = Assembly.GetExecutingAssembly().GetName().Version.ToString();
                Regex re = new Regex("urlArgs:\"v=(.*?)\"", RegexOptions.IgnoreCase | RegexOptions.Singleline);

                var entryFile = HostingEnvironment.MapPath("/js/entry.min.js");
                if (File.Exists(entryFile))
                {
                    Match m = re.Match(File.ReadAllText(entryFile));
                    if (m.Success)
                        Client = m.Groups[1].Value;
                }
            }
        }

        public const int PAGE_SIZE = 30;

        static System.Resources.ResourceManager _rm;
        public static string GetResource(string resourceName, CultureInfo ci = null)
        {
            if (_rm == null)
                _rm = new System.Resources.ResourceManager("Resources.Client", Assembly.Load("App_GlobalResources"));
            if (ci == null)
                ci = Thread.CurrentThread.CurrentUICulture;

            return _rm.GetString(resourceName, ci);
        }

        public static WebWorkerAPIProxy ProxyGetWorker()
        {
            return WebWorkerAPIProxy.ProxyGet($"{GetExternalCoreEndpoint()}/Worker");
        }

        public static WReportsAPIProxy ProxyGetWReports()
        {
            return WReportsAPIProxy.ProxyGet($"{GetExternalCoreEndpoint()}/WReports");
        }

        public static string GetResource(MemberInfo mi, CultureInfo ci = null)
        {
            var resName = (mi.DeclaringType.Name + "_" + mi.Name);
            return GetResource(resName, ci);
        }

        static string _tempGraphvis;
        public static string GetFolder_Graphvis()
        {
            return _tempGraphvis ?? (_tempGraphvis = ConfigurationManager.AppSettings["Path_Graphvis"]);
        }

        static string _tempPath;
        public static string GetFolder_Temp()
        {
            return _tempPath ?? (_tempPath = ConfigurationManager.AppSettings["Path_Temp"]);
        }

        static string _exportPath;
        public static string GetFolder_Export()
        {
            return _exportPath ?? (_exportPath = ConfigurationManager.AppSettings["Path_Export"]);
        }

        static string _originalSourcePath;
        public static string GetFolder_OriginalSource()
        {
            return _originalSourcePath ??
                   (_originalSourcePath = ConfigurationManager.AppSettings["Path_OriginalSources"]);
        }

        static string _semanticNetPath;
        public static string GetFolder_SemanticNet()
        {
            return _semanticNetPath ?? (_semanticNetPath = ConfigurationManager.AppSettings["Path_SemNetData"]);
        }

        static string _mapMarkersPath;
        public static string GetFolder_MapMarkers()
        {
            return _mapMarkersPath ?? (_mapMarkersPath = ConfigurationManager.AppSettings["Path_MapMarkers"]);
        }

        static string _externalCoreEndpoint;
        public static string GetExternalCoreEndpoint()
        {
            return _externalCoreEndpoint ?? (_externalCoreEndpoint = ConfigurationManager.AppSettings["ExternalCoreEndpoint"]);
        }


        static string _host;
        private static string _videoHost;

        public static string GetMyHostName()
        {
            return _host ?? (_host = ConfigurationManager.AppSettings["MyHost"]);
        }

        public static CultureInfo GetBrowserLang()
        {
            if (HttpContext.Current != null && HttpContext.Current.Request.UserLanguages != null &&
                HttpContext.Current.Request.UserLanguages.Length > 0)
            {
                // Create array of CultureInfo objects
                var cultures = new CultureInfo[HttpContext.Current.Request.UserLanguages.Length + 1];
                for (var ctr = HttpContext.Current.Request.UserLanguages.GetLowerBound(0); ctr <= HttpContext.Current.Request.UserLanguages.GetUpperBound(0);
                         ctr++)
                {
                    if (ctr > 0) break; //в данный момент нас интересует только первая локаль (но в дальнейшем может пригдитья)

                    var locale = HttpContext.Current.Request.UserLanguages[ctr];
                    if (!string.IsNullOrEmpty(locale))
                    {

                        // Remove quality specifier, if present.
                        if (locale.Contains(";"))
                            locale = locale.Substring(0, locale.IndexOf(';'));
                        try
                        {
                            cultures[ctr] = new CultureInfo(locale, false);
                        }
                        catch (Exception)
                        {

                        }
                    }
                    else
                    {
                        cultures[ctr] = CultureInfo.CurrentCulture;
                    }
                }
                //cultures[HttpContext.Current.Request.UserLanguages.Length] = CultureInfo.InvariantCulture;

                return cultures[0];
            }

            return CultureInfo.InvariantCulture;
        }

        public static string GetCurrentLangFromKey(string key)
        {
            var uri = new Uri(key);
            var dbSegment = uri.Segments[1];
            var cultureDescriptor = dbSegment.Remove(0, 5).Replace("/", "");

            return cultureDescriptor;
        }

        public static string GetCurrentLang(string key = null)
        {
            //Если есть ключ, то однозначно язык уже определен и проинициализирован в CustomAuthorizationApiHandler
            //Как выяснилось в большинстве случаев Да, но не в случае с SignalR...

            if (key != null) //используется для SignalR
                return GetCurrentLangFromKey(key);

            string result;
            var cl = Thread.CurrentThread.CurrentUICulture.Name; // default en-US

            var currentContext = HttpContext.Current;
            if (currentContext.Request.Headers["key"] != null)
                return cl;

            var rl = (string)currentContext.Request.RequestContext.RouteData.Values["lang"];
            var saLang = currentContext.Request.Cookies.Get("sa_lang");

            if (!string.IsNullOrWhiteSpace(rl))
            {
                cl = rl;
            }
            //else
            //if (saLang != null)
            //{
            //    cl = saLang.Value;
            //}
            else if (currentContext.Request.UserLanguages != null && currentContext.Request.UserLanguages.Any())
            {
                cl = currentContext.Request.UserLanguages.GetValue(0).ToString();
            }


            if (DetectCulture(cl, out result))
            {
                if (saLang == null)
                    saLang = new HttpCookie("sa_lang", cl);
                else saLang.Value = cl;
                saLang.Expires = DateTime.Now.AddMonths(1);
                saLang.Domain = currentContext.Request.Url.Host;
                currentContext.Response.Cookies.Add(saLang);
            }
            else
            {
                result = Thread.CurrentThread.CurrentUICulture.Name;
            }

            Thread.CurrentThread.CurrentUICulture = new CultureInfo(result);
            Thread.CurrentThread.CurrentCulture = CultureInfo.CreateSpecificCulture(result);
#if (RELEASE_IS || DEBUG)
            //System.Diagnostics.Trace.WriteLine("Current user:" + HttpContext.Current.User.Identity.Name);
            //System.Threading.Thread.CurrentPrincipal =
            //    new GenericPrincipal(new GenericIdentity(HttpContext.Current.User.Identity.Name), new string[] { });
#endif


            return result;
        }

        private static bool DetectCulture(string currentLang, out string result)
        {
            var languages =
                ConfigurationManager.AppSettings["​​Languages"].Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);

            result = "";
            var flag = false;
            foreach (var language in languages)
            {
                if (language.ToLower().Contains(currentLang.ToLower()))
                {
                    result = language;
                    flag = true;
                    break;
                }
            }

            return flag;
        }

        private static int?[] GetMapping(DataTable table)
        {
            var map = new int?[6];

            #region Object_ID
            var index = table.Columns.IndexOf("Object_ID");
            if (index >= 0)
                map[0] = index;
            #endregion

            #region Display_Name
            index = table.Columns.IndexOf("Display_Name");
            if (index >= 0)
                map[1] = index;
            else
            {
                index = table.Columns.IndexOf("DisplayName");
                if (index >= 0)
                    map[1] = index;
            }
            #endregion

            #region TypeName
            index = table.Columns.IndexOf("TypeName");
            if (index >= 0)
                map[2] = index;
            else
            {
                index = table.Columns.IndexOf("TypeDispName");
                if (index >= 0)
                    map[2] = index;
            }
            #endregion

            #region Type_ID
            index = table.Columns.IndexOf("Type_ID");
            if (index >= 0)
                map[3] = index;
            #endregion

            #region CreatedDate
            index = table.Columns.IndexOf("CreatedDate");
            if (index >= 0)
                map[4] = index;
            #endregion

            #region UID
            index = table.Columns.IndexOf("UID");
            if (index >= 0)
                map[5] = index;
            #endregion


            return map;
        }

        internal static DataRow[] GetListRows(DataTable td, int page)
        {
            var start = (page - 1) * PAGE_SIZE;
            var output = td.AsEnumerable().Skip(start).Take(PAGE_SIZE).ToArray();

            return output;
        }

        internal static DataRow[] GetListRows(DataTable td, int page, int pagesize)
        {
            var start = (page - 1) * pagesize;
            var output = td.AsEnumerable().Skip(start).Take(pagesize).ToArray();

            return output;
        }

        internal static List<ListElement> GetList(IPagedQuery pq, int page)
        {
            pq.Execute();
            DataTable td = pq.QueryResult;
            var map = GetMapping(td);

            var output = td.AsEnumerable().Select((item, i) =>
                new ListElement
                {
                    id = map[0] != null ? Convert.ToInt32(item[map[0].Value]) : -1,     //Object_ID
                    uid = map[5] != null ? item[map[5].Value].ToString() : "",          //UID
                    title = map[1] != null ? item[map[1].Value].ToString() : "",        //Display_Name
                    type = map[2] != null ? item[map[2].Value].ToString() : "",         //TypeName
                    typeid = map[3] != null ? Convert.ToInt32(item[map[3].Value]) : -1, //Type_ID
                    date = map[4] != null ? Convert.ToDateTime(item[map[4].Value]).ToString("dd.MM.yyyy") : "",         //CreatedDate
                    num = ((page - 1) * PAGE_SIZE + i) + 1,
                    description = ""
                }).ToList();

            output.Add(new ListElement
            {
                id = 0,
                num = pq.TotalRowCount,
                pageSize = PAGE_SIZE,
                page = page
            });

            return output;
        }


        internal static List<ListElement> GetList(DataTable td, int page)
        {
            var map = GetMapping(td);

            var start = (page - 1) * PAGE_SIZE;
            var output = td.AsEnumerable().Skip(start).Take(PAGE_SIZE).Select((item, i) =>
                new ListElement
                {
                    id = map[0] != null ? Convert.ToInt32(item[map[0].Value]) : -1,     //Object_ID
                    uid = map[5] != null ? item[map[5].Value].ToString() : "",          //UID
                    title = map[1] != null ? item[map[1].Value].ToString() : "",        //Display_Name
                    type = map[2] != null ? item[map[2].Value].ToString() : "",         //TypeName
                    typeid = map[3] != null ? Convert.ToInt32(item[map[3].Value]) : -1, //Type_ID
                    date = map[4] != null ? Convert.ToDateTime(item[map[4].Value]).ToString("dd.MM.yyyy") : "",         //CreatedDate
                    num = ((page - 1) * PAGE_SIZE + i) + 1,
                    description = ""
                }).ToList();

            output.Add(new ListElement
            {
                id = 0,
                num = td.Rows.Count,
                pageSize = PAGE_SIZE,
                page = page
            });

            return output;
        }

        internal static List<T> GetList<T>(List<T> td, int page) where T : ListElement, new()
        {
            var start = (page - 1) * PAGE_SIZE;
            var output = td.Skip(start).Take(PAGE_SIZE).Select((item, i) =>
            {
                item.num = ((page - 1) * PAGE_SIZE + i) + 1;
                return item;
            }).ToList();

            output.Add(new T
            {
                id = 0,
                num = td.Count(),
                pageSize = PAGE_SIZE,
                page = page
            });

            return output;
        }


        internal static List<ListElement> GetList(DataTable td)
        {
            var map = GetMapping(td);

            var output = td.AsEnumerable().Select((item, i) =>
                new ListElement
                {
                    id = map[0] != null ? Convert.ToInt32(item[map[0].Value]) : -1,     //Object_ID
                    uid = map[5] != null ? item[map[5].Value].ToString() : "",          //UID
                    title = map[1] != null ? item[map[1].Value].ToString() : "",        //Display_Name
                    type = map[2] != null ? item[map[2].Value].ToString() : "",         //TypeName
                    typeid = map[3] != null ? Convert.ToInt32(item[map[3].Value]) : -1, //Type_ID
                    date = map[4] != null ? Convert.ToDateTime(item[map[4].Value]).ToString("dd.MM.yyyy") : "",         //CreatedDate
                    description = ""
                }).ToList();

            return output;
        }


        /// <summary>
        /// Подготовить список по уже таблице, которая уже содержит нужную страницу 
        /// </summary>
        /// <param name="td"></param>
        /// <param name="page"></param>
        /// <param name="totalPage"></param>
        /// <returns></returns>
        internal static List<ListElement> GetList(DataTable td, int page, int totalPage)
        {
            var map = GetMapping(td);

            var output = td.AsEnumerable().Select((item, i) =>
                new ListElement
                {
                    id = map[0] != null ? Convert.ToInt32(item[map[0].Value]) : -1,     //Object_ID
                    uid = item["UID"].ToString(),
                    title = map[1] != null ? item[map[1].Value].ToString() : "",        //Display_Name
                    type = map[2] != null ? item[map[2].Value].ToString() : "",         //TypeName
                    typeid = map[3] != null ? Convert.ToInt32(item[map[3].Value]) : -1, //Type_ID
                    date = map[4] != null ? Convert.ToDateTime(item[map[4].Value]).ToString("dd.MM.yyyy") : "",         //CreatedDate
                    num = ((page - 1) * PAGE_SIZE + i) + 1
                }).ToList();

            output.Add(new ListElement
            {
                id = 0,
                num = totalPage,
                pageSize = PAGE_SIZE,
                page = page
            });

            return output;
        }

        public static int CalcRowFrom(int? pageNumber)
        {
            return CalcRowFrom(pageNumber, CalcPageSize(null));
        }

        private static int CalcPageNumber(int? pageNumber)
        {
            // ReSharper disable once PossibleInvalidOperationException
            return (pageNumber ?? 0) == 0 ? 1 : pageNumber.Value;
        }

        private static int CalcRowFrom(int? pageNumber, int? pageSize)
        {
            int page = CalcPageNumber(pageNumber);
            int pSize = CalcPageSize(pageSize);
            int fromRow = pSize * (page - 1);

            return fromRow;
        }

        private static int CalcPageSize(int? pageSize)
        {
            int pSize = pageSize ?? PAGE_SIZE;
            if (pSize == default(int))
                pSize = PAGE_SIZE;

            return pSize;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="query"></param>
        /// <param name="page">Начинается с 1</param>
        /// <param name="pageSize"></param>
        /// <returns></returns>
        internal static List<ListElement> GetList(IQuery query, int page, int? pageSize = null)
        {
            pageSize = CalcPageSize(pageSize);

            query.PageSize = pageSize.Value;
            query.StartPage = page - 1;
            var res = query.Execute();

            var td = res.DataSet.Tables[0];
            var map = GetMapping(td);

            var uidExists = td.Columns.IndexOf("UID") != -1;
            var output = td.AsEnumerable().Select((item, i) =>
                            new ListElement
                            {
                                id = map[0] != null ? Convert.ToInt32(item[map[0].Value]) : -1,     //Object_ID
                                uid = uidExists ? item["UID"].ToString() : "",
                                title = map[1] != null ? item[map[1].Value].ToString() : "",        //Display_Name
                                type = map[2] != null ? item[map[2].Value].ToString() : "",         //TypeName
                                typeid = map[3] != null ? Convert.ToInt32(item[map[3].Value]) : -1, //Type_ID
                                date = map[4] != null ? Convert.ToDateTime(item[map[4].Value]).ToString("dd.MM.yyyy") : "",         //CreatedDate
                                num = ((page - 1) * pageSize.Value + i) + 1
                            }).ToList();

            output.Add(new ListElement
            {
                id = 0,
                num = res.TotalResultCount,
                pageSize = pageSize.Value,
                page = page
            });

            return output;
        }

        /// <summary>
        /// Получаем результаты запроса через SDK
        /// </summary>
        /// <param name="query"></param>
        /// <param name="page">Начинается с 1</param>
        /// <param name="pageSize"></param>
        /// <returns></returns>
        internal static DataRaw GetDataRaw(IQuery query, int page, int? pageSize = null)
        {
            pageSize = CalcPageSize(pageSize);

            query.PageSize = pageSize.Value;
            query.StartPage = page - 1;
            var res = query.Execute();

            var td = res.DataSet.Tables[0];
            var output = new DataRaw { data = td, TotalRecordCount = res.TotalResultCount };

            return output;
        }

        /// <summary>
        /// Получаем результаты запроса через Query Provider
        /// </summary>
        /// <param name="saDB"></param>
        /// <param name="qfd"></param>
        /// <returns></returns>
        internal static DataRaw GetDataRaw(IDataBase saDB, QueryFileData qfd)
        {
            string sqlQuery = qfd.ToString();
            var viewType = qfd.MainQueryInfo.CrossView == TypeObjectListView.CrossTable ? qfd.MainQueryInfo.StandardView : qfd.MainQueryInfo.CrossView;

            var td = saDB.QueriesProvider.ExecuteQuery(sqlQuery).DataSet.Tables[0];

            if (viewType == TypeObjectListView.Graph)
            {
#warning 2016-04-11 Необходимо поддержать совместимость со Win-версией структур данных для графиков
                /* 
                int DataColumnsCount = td.Columns.Count - 2;
                foreach (DataRow r in td.Rows)
                {
                }
                */
            }

            var output = new DataRaw { data = td, TotalRecordCount = td.Rows.Count };

            return output;
        }

        /// <summary>
        /// Получаем результаты запроса через Query Provider
        /// </summary>
        /// <param name="qprovider"></param>
        /// <param name="qfd"></param>
        /// <param name="page">Первая страница = 1</param>
        /// <param name="pageSize"></param>
        /// <returns></returns>
        internal static DataRaw GetDataRawPaged(IDataBase qprovider, QueryFileData qfd, int? page, int? pageSize = null)
        {
            return GetDataRawPagedV2(qprovider, qfd, page, pageSize);
        }

        internal static DataRaw GetDataRawPagedV2(IDataBase saDB, QueryFileData qfd, int? page, int? pageSize)
        {
            return GetDataRawPagedV2(saDB, qfd.ToString(), page, pageSize);
        }

        internal static DataRaw GetDataRawPagedV2(IDataBase saDB, string sql, int? page, int? pageSize)
        {
            var pageSizeCalc = CalcPageSize(pageSize);
            var pageNumberCalc = CalcPageNumber(page);
            var fromRow = CalcRowFrom(pageNumberCalc, pageSizeCalc);

            TextPageQuery tpq = new TextPageQuery { SqlScript = sql, FromRow = fromRow, RowCount = pageSizeCalc };
            BasePageResult tdPaged = saDB.QueriesProvider.ExecuteQueryPage(tpq);
            var output = new DataRaw { data = tdPaged.Result.Tables[0], TotalRecordCount = tdPaged.TotalResultCount, Page = pageNumberCalc, PageSize = pageSizeCalc };

            return output;
        }

        public static string Layout(string dotString, int layoutType, string objectUID, string tmpFolder,
            Dictionary<string, SemNetElement> elements,
            Dictionary<int, string> linkToEl,
            Dictionary<int, string> linkFromEl, out int widthSN, out int heightSN
            )
        {

            var dotFileName = Path.Combine(tmpFolder, objectUID + ".dot");
            var svgFileName = Path.Combine(tmpFolder, objectUID + ".svg");

            File.WriteAllText(dotFileName, dotString);

            if (layoutType == 1)
                Command(@"neato",
                    $"-y -n2 -Tsvg {dotFileName} -o {svgFileName}");
            if (layoutType == 2 || layoutType == 3)
                Command(@"dot",
                    $"-y -Tsvg {dotFileName} -o {svgFileName}");
            if (layoutType == 4)
                Command(@"neato",
                    $"-y -Tsvg {dotFileName} -o {svgFileName}");
            if (layoutType == 5)
                Command(@"fdp",
                    $"-y -Tsvg {dotFileName} -o {svgFileName}");
            if (layoutType == 6)
                Command(@"twopi",
                    $"-y -Tsvg {dotFileName} -o {svgFileName}");
            if (layoutType == 7)
                Command(@"circo",
                    $"-y -Tsvg {dotFileName} -o {svgFileName}");

            var svg = File.ReadAllText(svgFileName);

            var reWH = new Regex(@"<svg\s+width=""(\d+)pt""\s+height=""(\d+)pt""", RegexOptions.Singleline | RegexOptions.IgnoreCase);
            var mWH = reWH.Match(svg);

            svg = svg.Substring(svg.IndexOf("<svg", StringComparison.Ordinal));
            svg = svg.Replace(@"<polygon fill=""white""", @"<polygon fill=""none""");

            const string node = @"
<g id=""el{0}"" class=""node"" data-edgesTo=""{20}"" data-edgesFrom=""{21}""  data-objectid=""{11}"" data-text=""{7}""  width=""{4}"" height=""{5}"" x=""{2}"" y=""{3}"" transform=""translate({2},{3})"">
      <clipPath id=""clip{0}"">
        <rect x=""-1"" y=""-1"" width=""{16}"" height=""{17}""/>
      </clipPath>
    {24}
    <title>{7}</title>
    <rect width=""{4}"" height=""{5}"" rx=""5"" ry=""5"" fill='{14}' stroke='{13}' stroke-width=""0.1""/>
      <switch>
        <foreignObject x=""0"" y=""0"" width=""{4}"" height=""{5}"" style=""text-align: center;font:{8} {9}px {10}"" >
          <span xmlns=""http://www.w3.org/1999/xhtml"" style=""{23}vertical-align: middle;overflow:hidden;color:{12};height:{5}px;width:{4}px"" title=""{18}"">{18}</span>
        </foreignObject>
        <text clip-path=""url(#clip{0})"" width=""{4}"" id='{11}' style=""font:{8} {9}px {10};color:{12};text-anchor: middle"" fill='black' x=""{22}"" y=""1"">{1}</text>    
      </switch>
    {15}
</g>";

            const string gradientDataTemplate = @"
  <defs>
    <linearGradient id=""grad{0}"" x1=""0%"" y1=""100%"" x2=""0%"" y2=""0%"">
      <stop offset=""0%"" style=""stop-color:{1};stop-opacity:1"" />
      <stop offset=""100%"" style=""stop-color:{2};stop-opacity:1"" />
    </linearGradient>
  </defs>
";

            //var re1 = new Regex(@"id=""(?<id>.*?)""", RegexOptions.Singleline | RegexOptions.IgnoreCase);
            var re = new Regex(@"<g id=""(?<id>el.*?)"".*?>(?<g>.*?<polygon.*?points=""(?<points>.*?)""/>.*?)</g>", RegexOptions.Singleline | RegexOptions.IgnoreCase);
            var re2 = new Regex(@"<svg.*?>", RegexOptions.Singleline | RegexOptions.IgnoreCase);
            svg = re2.Replace(svg, m =>
            {
                return @"<svg id=""svgSN"" width=""100%"" height=""100%"" xmlns=""http://www.w3.org/2000/svg"" xmlns:xlink=""http://www.w3.org/1999/xlink"">";
            });

            double maxX = 0;
            double maxY = 0;
            svg = re.Replace(svg, m =>
            {
                var nodeID = m.Groups["id"].Value;
                var vertexes = m.Groups["points"].Value;

                var vArr = vertexes.Split(' ');
                var pTopLeft = vArr[1].Split(',');
                var pBottomRight = vArr[3].Split(',');

                var brX = Double.Parse(pBottomRight[0], new CultureInfo("en-US"));
                var tlX = Double.Parse(pTopLeft[0], new CultureInfo("en-US"));

                var brY = Double.Parse(pBottomRight[1], new CultureInfo("en-US"));
                var tlY = Double.Parse(pTopLeft[1], new CultureInfo("en-US"));


                var height = brY - tlY;
                var width = brX - tlX;

                var elemID = nodeID.Substring(2);

                var el = elements[elemID];
                string edgesTo;
                linkToEl.TryGetValue(el.Id, out edgesTo);

                string edgesFrom;
                linkFromEl.TryGetValue(el.Id, out edgesFrom);

                el.WrapText.SetXTSpanValue((float)width / 2);
                el.WrapText.ReFormat();

                string gradientData = "";
                if (el.GradientVisible)
                {
                    Color colorStart = ColorTranslator.FromWin32(el.GradientColorStart);
                    Color colorEnd = ColorTranslator.FromWin32(el.GradientColorEnd);

                    gradientData = String.Format(gradientDataTemplate, el.Id, ColorTranslator.ToHtml(colorStart),
                        ColorTranslator.ToHtml(colorEnd));
                }

                if (Math.Abs(brX) > maxX) maxX = Math.Abs(brX);
                if (Math.Abs(tlY) > maxY) maxY = Math.Abs(tlY);


                var txtNode = String.Format(node,
                    el.Id,
                    el.WrapText.TextFormatted,
                    pTopLeft[0],
                    pTopLeft[1], //3
                    width.ToString(CultureInfo.InvariantCulture),
                    height.ToString(CultureInfo.InvariantCulture),
                    0, //6 not used
                    HttpUtility.HtmlEncode(el.Text == "..." ? el.FullText : el.Text),
                    el.FontStyle == 0 ? "normal" : "bold",
                    el.FontSize,
                    el.FontName,
                    el.ObjectId,
                    el.FontColor,
                    el.BorderColor,
                    el.GradientVisible ? String.Format("url(#grad{0})", el.Id) :
                        (el.ShapeColor == "#000000" ? "#fff" : el.ShapeColor),
                    string.IsNullOrWhiteSpace(el.Image.FilePath) //15
                        ? ""
                        : string.Format(
                            @"<image x=""{0}"" y=""{1}"" width=""{2}"" height=""{3}"" xlink:href=""{4}"" />",
                            (width / 2 - (float)el.Image.Width / 2).ToString(CultureInfo.InvariantCulture),
                            (el.WrapText.Size.Height + (height - el.Image.Height - el.WrapText.Size.Height) / 2).ToString(CultureInfo.InvariantCulture),
                            el.Image.Width,
                            el.Image.Height,
                            el.Image.FilePath),
                    (width + 4 + 2).ToString(CultureInfo.InvariantCulture),  //clip area 16
                    (height + 2).ToString(CultureInfo.InvariantCulture),  //clip area 17
                    HttpUtility.HtmlEncode(el.Text),  //18 исходный, не разбитый на строки текст 
                    el.FontSize + 2, //19 сдвиг текста по оси Y (чтобы он вошел в фигуру) (базовая линия)
                    edgesTo, //20 data-edgesTo
                    edgesFrom, //21 data-edgesFrom
                    (width / 2).ToString(CultureInfo.InvariantCulture), // 22
                    String.IsNullOrWhiteSpace(el.Image.FilePath) ? "display: table-cell;" : "", //23
                    gradientData//24 gradient
                );

                return txtNode;


            });

            File.WriteAllText(svgFileName, svg);

            if (mWH.Success)
            {
                widthSN = Convert.ToInt32(mWH.Groups[1].Value);
                heightSN = Convert.ToInt32(mWH.Groups[2].Value);
            }
            else
            {
                widthSN = (int)maxX;
                heightSN = (int)maxY;
            }

            return svg;
        }

        /*
                public static int GetCheckConvert(string uid)
                {
                    var path = @"C:\___55555";
                    if (File.Exists(Path.Combine(path, "500.tmp")))
                        return 500;
                    if (File.Exists(Path.Combine(path, "404.tmp")))
                        return 404;
                    if (File.Exists(Path.Combine(path, "200.tmp")))
                        return 200;
                    if (File.Exists(Path.Combine(path, "1.tmp")))
                        return 0;
                    if (File.Exists(Path.Combine(path, "0.tmp")))
                        return 0;

                    return 404;
                }

                public static void GetStartConvert(string sourceFileName, int id)
                {
                    try
                    {
                        var path = @"C:\___55555";
                        var destFileNameFull = Path.Combine(path, id + ".svg");
                        if (Directory.Exists(path)) return;

                        if (!Directory.Exists(path))
                            Directory.CreateDirectory(path);

                        File.Create(Path.Combine(path, "0.tmp"));

                        //создание dot

                        File.Create(Path.Combine(path, "1.tmp"));

                        System.Threading.Tasks.Task.Run(() =>
                        {
                            //запуск конвертации

                            File.Create(Path.Combine(path, "200.tmp"));
                        });
                    }
                    catch
                    {
                    }
                }
        */

        public static void Command(params string[] args)
        {
            var proc = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = String.Format(@"{0}{1}.exe", GetFolder_Graphvis(), args[0]),
                    Arguments = args[1],
                    UseShellExecute = false,
                    RedirectStandardOutput = false,
                    CreateNoWindow = true
                }
            };

            proc.Start();
            //string output = proc.StandardOutput.ReadToEnd();
            proc.WaitForExit();
        }

        public static void SendMail(SendMessage message, bool isBodyHtml = false)
        {
            if (String.IsNullOrEmpty(message?.Email) || message.Email.IndexOf("@", StringComparison.Ordinal) == -1) return;

            using (var mail = new MailMessage())
            {
                mail.To.Add(message.Email);
                mail.Subject = message.Subject;
                mail.Body = message.Text;
                mail.IsBodyHtml = isBodyHtml;

                foreach (var filePath in message.Attachments)
                {
                    if (String.IsNullOrWhiteSpace(filePath)) continue;

                    var fileData = filePath.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);

                    var attachmentItem = new Attachment(fileData[0]);
                    if (fileData.Length > 1)
                        attachmentItem.Name = fileData[1];
                    mail.Attachments.Add(attachmentItem);
                }

                using (var smtpServer = new SmtpClient())
                {
                    smtpServer.Send(mail);
                }
            }
        }

        public static string GetParamFrom(this HttpRequestMessage request, string paramName)
        {
            var qnv = request.GetQueryNameValuePairs();
            KeyValuePair<string, string> wndParam = qnv.FirstOrDefault(item => item.Key == paramName);
            return wndParam.Value;
        }

        /// <summary>
        /// Возвращает значение параметра из ключа заголовка
        /// </summary>
        /// <param name="paramName"></param>
        /// <returns></returns>
        public static string GetDataFromKey(KeyElement paramName)
        {
            var key = Scope.GetCurrentUrl();
            if (String.IsNullOrWhiteSpace(key)) return null;

            var m = Regex.Match(key, $"[&?#]{paramName}=(.*?)(?:$|&|#)", RegexOptions.Singleline | RegexOptions.IgnoreCase);
            if (m.Success && m.Groups.Count > 1)
                return m.Groups[1].Value;

            return null;
        }

        public static string GetIdFromKey(string url)
        {
            if (String.IsNullOrWhiteSpace(url)) return null;

            var re = new Regex(@"[&?#]id=(\d+)(.*?)(?:$|&|#)");
            Match match = re.Match(url);

            return match.Groups.Count > 1 ? match.Groups[1].Value : null;
        }

        public enum KeyElement
        {
            /// <summary>
            /// используется при фильтрации по источнику
            /// </summary>
            ids,
            /// <summary>
            /// UID проверки
            /// </summary>
            checkuid,
            /// <summary>
            /// Идентификатор запроса
            /// </summary>
            rid,
            /// <summary>
            /// Идентификатор проверяемого объекта
            /// </summary>
            id,
            /// <summary>
            /// Данные по проекту
            /// </summary>
            prjid
        }

        public static string GetCacheKeyByRequest(Uri request)
        {
            return Scope.GetCurrentUrl() + "_" + request.PathAndQuery;
        }

        public static string GetVideoHost()
        {
            return _videoHost ?? (_videoHost = ConfigurationManager.AppSettings["VideoHost"]);
        }
    }
}