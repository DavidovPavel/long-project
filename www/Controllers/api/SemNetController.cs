using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web.Http;
using ANBR.SemanticArchive.DataContracts;
using ANBR.SemanticArchive.SDK;
using www.Models;
using System.Collections.Specialized;
using www.SaGateway;
using Anbr.Web.SA.CoreLogic;

namespace www.Controllers.api
{
    /// <inheritdoc />
    /// <summary>
    /// Работа с семантической сетью
    /// </summary>
    public class SemNetController : ApiController
    {
        /// <summary>
        /// Получить данные по пользовательским раскладкам
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        public UserSNMeta UserSNMeta(int id)
        {
            var snMeta = new UserSNMeta();
            List<SemanticReport> SR_LI = WebSaUtilities.Database.ObjectService.GetObjectSemanticReports(id);

            snMeta.Tabs.Add(new SemNetUser {title = Root.GetResource("SemNet_AutoTabName"), snid = -1, id = id});

            foreach (SemanticReport SR in SR_LI)
                snMeta.Tabs.Add(new SemNetUser {title = SR.Name, snid = SR.SemanticReport_ID, id = id});

            return snMeta;
        }


        /// <summary>
        /// Возвращает раскладку семантической сети на основе заданных параметров
        /// </summary>
        /// <param name="id">ID объекта</param>
        /// <param name="semnetid">-1 - автоматическая раскладки, 0,1,2.... - индекс по порядку пользовательских</param>
        /// <param name="layout">Раскладка</param>
        /// <param name="level"></param>
        /// <param name="astree"></param>
        /// <returns></returns>
        [ActionName("DefaultAction")]
        public SemNet Get(int id, int semnetid, int? layout = null, int? level = null, int? astree = null)
        {
            // Root.GetFolder_OriginalSource() содержит путь к папке, куда кэшируются 
            // результаты конвертации
            // формат ссылки доступа к ресурсу  @"{0}{1}/{2}/{3}.jpg", Root.GetFolder_SemanticNet(), DBID, mainObjectUID, attribute.Value

            IDataBase saDB = WebSaUtilities.Database;
            string currentDatabaseID = Scope.GetCurrentDBID();

            #region Parsing parameters

            SnStruct? snStruct = null;
            SnExtendedProperties ep = null;
            string filterName = "";
            SnFilter filter = null;
            int[] eparam = null;

            NameValueCollection qs = Request.RequestUri.ParseQueryString();
            if (qs.Count > 0)
            {
                if (int.TryParse(qs["astree"], out var snStructParam)) snStruct = (SnStruct) snStructParam;

                filterName = qs["fname"];
                if (qs["eparam[]"] != null)
                {
                    eparam = qs["eparam[]"].Split(',').Select(int.Parse).ToArray();
                    ep = new SnExtendedProperties
                    {
                        FactNameFormat = FactNameFormat.FullName,
                        ShowLegend = eparam[1] == 1,
                        StrategTypeGroupLevel = eparam[2] == 1
                    };
                }

                if (!string.IsNullOrWhiteSpace(qs["filter[]"]))
                {
                    string[] vv = qs["filter[]"].Split(new[] {','}, StringSplitOptions.RemoveEmptyEntries);
                    var output = new List<int>();
                    output.AddRange(vv.Select(s => Convert.ToInt32(s)));
                    filter = new SnFilter {ExcludeObjectTypes = output.ToArray()};
                }
            }

            //Set default values
            Helpers.HelperSemNet.CalcConfigurationParams(saDB, ref layout, ref level, ref snStruct, ref ep, ref filter,
                ref eparam);

            #endregion

            // ReSharper disable PossibleInvalidOperationException
            string svgText = Helpers.HelperSemNet.GetSNInternal(id, semnetid, saDB, currentDatabaseID, layout.Value,
                level.Value, snStruct.Value, out var width, out var height, filter, ep);

            var info = saDB.ObjectModel.GetObjectInfo(id);

            return new SemNet
            {
                id = id,
                title = info.DisplayName,
                html = svgText,
                width = width,
                height = height,
                level = level.Value,
                astree = (int) snStruct.Value,
                filterValue = qs["filter[]"],
                filterName = filterName,
                eparam = eparam,
                snid = semnetid
            };
        }
    }
}