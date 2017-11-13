using System.Text.RegularExpressions;
using Anbr.Web.SA.CoreLogic;
using Anbr.Web.SA.CoreLogic.Model;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Web.Http;
using www.Models;
using www.Models.Common;
using www.Models.Ex.Feed;
using www.SaGateway;

namespace www.Controllers.api
{
    public class CommonController : ApiController
    {
        /// <summary>
        /// проверка сессии and state
        /// </summary>
        /// <returns></returns>
        [ActionName("DefaultAction")]
        [Route("api/state/tick")]
        public AppState GetSessionState()
        {
            bool isMBFStandAlone = true;
            int state = 0;
            try
            {
                isMBFStandAlone = WebSaUtilities.MBF.IsStandAloneMode();
                state = WebSaUtilities.MBF.GetServiceState();
            }
            catch { }


            return new AppState
            {
                AuthState = 1,
                MMCSState = (state & 1) == 1 ? 0 : 1,
                IsMBFStandAlone = isMBFStandAlone
            };
        }

        /// <summary>
        /// Позволяет задать динамический контент (на основе окружение dbid, язык)
        /// </summary>
        /// <param name="model"></param>
        /// <param name="kindid">
        /// 0 - автоматическое разрешение (т.е. если есть спец. контент, то вернется он, если нет, то вернется содержимое по умолчанию
        /// 1 - получить контент по умолчанию
        /// 2 - получить специализированный
        /// </param>
        /// <param name="secid"></param>
        /// <returns></returns>
        [Route("api/common/{kindid:int}/{secid:guid}")]
        [HttpPost]
        [HttpPut]
        public async Task<ContentItem> SetDynamicContent(ModelDynamicContent model, int kindid, Guid secid)
        {
            if (!Scope.IsSupervizer()) throw new InvalidOperationException("Not supported operation");
            if (model.ForClientsOnly == "0") model.ForClientsOnly = "";
            if (model.ForDBsOnly == "0") model.ForDBsOnly = "";

            string dbid = Scope.GetCurrentDBID();
            string contentCode = secid.ToString();
            if (!String.IsNullOrWhiteSpace(model.ForDBsOnly))
                dbid = model.ForDBsOnly;

            switch (kindid)
            {
                case 1:
                case 2:
                    {
                        if (WebSaUtilities.Database != null)
                            contentCode = String.Format("{0}§{1}", secid, (int)WebSaUtilities.Database.DatabaseType);
                        break;
                    }
                case 3:
                    {
                        ExtractKeyData(out contentCode);
                        break;
                    }
            }

            await ContentBL.ContentSave(contentCode, dbid, model.ForClientsOnly, model.Html, kindid);

            var ci = new ContentItem();
            ci.AddProperty("state", "", 1, ANBR.Common.Contarcts.PropertyType.Integer, false, false)
                .AddProperty("html", "", model.Html, ANBR.Common.Contarcts.PropertyType.HTML, false, false);

            return ci;
        }

        private static void ExtractKeyData(out string contentCode)
        {
            string area = "";
            contentCode = Scope.GetCurrentUrl();
            if (contentCode.StartsWith("http", StringComparison.Ordinal))
            {
                var uri = new Uri(contentCode);
                contentCode = uri.PathAndQuery + uri.Fragment;
            }

            if (contentCode.IndexOf("/lang-", StringComparison.Ordinal) != -1)
            {
                var re = new Regex(@".*/lang.*/(?!db\d+)(.*)[?]");
                Match m = re.Match(contentCode);
                if (m.Success && m.Groups.Count > 1) area = m.Groups[1].Value;

                //if (contentCode.IndexOf("/db", System.StringComparison.Ordinal) != -1)
                //{
                //    re = new Regex(@".*/lang.*/db\d+/(.*?)(?:[#?/].*?|.*?)");
                //    m = re.Match(contentCode);
                //    if (m.Success && m.Groups.Count > 1) area = m.Groups[1].Value;
                //}
                if (String.IsNullOrWhiteSpace(area))
                {
                    re = new Regex(@".*/lang.*/(?!db\d+)(.*)#");
                    m = re.Match(contentCode);
                    if (m.Success && m.Groups.Count > 1) area = m.Groups[1].Value;
                }
            }

            if (area.ToLower() == "wall" && contentCode.IndexOf('#') > 0)
                contentCode = area + contentCode.Remove(0, contentCode.IndexOf('#'));
        }


        /// <summary>
        /// Позволяет удалить контент (на основе окружение dbid, язык)
        /// </summary>
        /// <param name="kindid">
        /// 1 - получить контент по умолчанию
        /// 2 - получить специализированный
        /// </param>
        /// <param name="secid">Идентификатор элемента</param>
        /// <param name="clientids">Это значение которое присутсвует в WYSISYG редакторе (используется только супервайзером в остальных случаях не передается</param>
        /// <param name="dbids">Это значение которое присутсвует в WYSISYG редакторе (используется только супервайзером в остальных случаях не передается</param>
        /// <returns></returns>
        [Route("api/common/{kindid:int}/{secid:guid}/{clientids?}/{dbids?}")]
        [HttpDelete]
        public async Task DeleteDynamicContent(int kindid, Guid secid, string clientids = "", string dbids = "")
        {
            if (clientids == "0") clientids = "";
            if (dbids == "0") dbids = "";

            if (!Scope.IsSupervizer()) throw new InvalidOperationException("Not supported operation");
            if (kindid == 0) throw new InvalidOperationException("kindid parameter should be defined");

            string dbid = Scope.GetCurrentDBID();
            string contentCode = secid.ToString();
            if (!String.IsNullOrWhiteSpace(dbids)) dbid = dbids;

            switch (kindid)
            {
                case 1:
                case 2:
                    {
                        if (WebSaUtilities.Database != null)
                            contentCode = String.Format("{0}§{1}", secid, (int)WebSaUtilities.Database.DatabaseType);
                        break;
                    }
                case 3:
                    {
                        ExtractKeyData(out contentCode);

                        break;
                    }
            }

            await ContentBL.ContentRemove(contentCode, dbid, clientids, kindid);
        }

        /// <summary>
        /// Позволяет получить динамический контент (на основе окружение dbid, язык)
        /// </summary>
        /// <param name="kindid">
        /// 0 - автоматическое разрешение (т.е. если есть спец. контент, то вернется он, если нет, то вернется содержимое по умолчанию
        /// 1 - получить контент по умолчанию
        /// 2 - получить специализированный
        /// </param>
        /// <param name="secid">Идентификатор элемента</param>
        /// <param name="clientids">Это значение которое присутсвует в WYSISYG редакторе (используется только супервайзером в остальных случаях не передается</param>
        /// <param name="dbids">Это значение которое присутсвует в WYSISYG редакторе (используется только супервайзером в остальных случаях не передается</param>
        /// <returns></returns>
        [Route("api/common/{kindid:int}/{secid:guid}/{clientids?}/{dbids?}")]
        [HttpGet]
        public async Task<ContentItem> GetDynamicContent(int kindid, Guid secid, string clientids = "", string dbids = "")
        {
            if (clientids == "0") clientids = "";
            if (dbids == "0") dbids = "";

#if (RELEASE)
            string clientID = WebSaUtilities.GetClients().First().ToString(CultureInfo.InvariantCulture);
#endif
#if (RELEASE_IS || DEBUG)
            string clientID = "0";
#endif


            string dbid = Scope.GetCurrentDBID();

            if (!String.IsNullOrWhiteSpace(clientids))
            {
                if (!Scope.IsSupervizer()) throw new InvalidOperationException("Not supported operation");
                clientID = clientids;
            }
            if (!String.IsNullOrWhiteSpace(dbids))
            {
                if (!Scope.IsSupervizer()) throw new InvalidOperationException("Not supported operation");
                dbid = dbids;
            }


            ExtractKeyData(out var contentCode);

            var content = await ContentBL.ContentByCode(contentCode, dbid, clientID, kindid);

            #region Получение контента с учетом идентификатора блока, базы и клиентов
            if (string.IsNullOrWhiteSpace(content?.Html))
            {
                if (WebSaUtilities.Database != null)
                    contentCode = $"{secid}§{(int) WebSaUtilities.Database.DatabaseType}";
                content = await ContentBL.ContentByCode(contentCode, dbid, clientID, kindid);
            }
            #endregion


            #region Получение контента с учетом идентификатора блока и клиентов
            if (string.IsNullOrWhiteSpace(content?.Html))
            {
                contentCode = secid.ToString();
                content = await ContentBL.ContentByCode(contentCode, dbid, clientID, kindid);
            }
            #endregion


            var ci = new ContentItem();
            ci.AddProperty("state", "", 1, ANBR.Common.Contarcts.PropertyType.Integer, false, false)
                .AddProperty("html", "", content != null ? content.Html : "", ANBR.Common.Contarcts.PropertyType.HTML, false, false)
                .AddProperty("ts", "", content != null ? content.ts : "0", ANBR.Common.Contarcts.PropertyType.String, false, false);

            return ci;
        }

        [Route("api/checkready/{id:int}")]
        public int GetCheckConvert(int id, int kind)
        {
            string userID = WebSaUtilities.GetCurrentUserID();
            string dbID = Scope.GetCurrentDBID();
            string dbName = WebSaUtilities.Database.ConnectionInfo.DatabaseName;

            NotificationReasonEnum enKind = (NotificationReasonEnum)Enum.Parse(typeof(NotificationReasonEnum), kind.ToString());

            switch (enKind)
            {
                case NotificationReasonEnum.r0_AutoFactExtractionAfterMBF:
                    {
                        string key = dbID + "|$|" + dbName;
                        int? status = NotificationBL.GetNotificationStatus(userID, key, NotificationReasonEnum.r0_AutoFactExtractionAfterMBF, id.ToString());

                        if (status.HasValue && status != 1)
                            return 102;

                        break;
                    }
            }

            return 200;
        }

        [HttpPost]
        [Route("api/common/synonyms")]
        public string[] GetSynonyms([FromBody] string phrase)
        {
            string[] words = phrase.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);

            var dics = new Dictionary<string, string[]>();
            foreach (var word in words)
                dics[word] = WebSaUtilities.Database.ServiceTools.GetWordForms(word);


            return null;
        }
    }
}
